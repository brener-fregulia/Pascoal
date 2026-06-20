use tauri::Emitter;

use crate::compiler::{compile, get_tmp_dir, CompileResult};
use crate::fs::write_file;

// ── Process state ─────────────────────────────────────────────────────────────

pub struct ProcessState {
    pub writer: std::sync::Mutex<Option<Box<dyn std::io::Write + Send>>>,
    pub generation: std::sync::atomic::AtomicU64,
}

impl ProcessState {
    pub fn new() -> Self {
        Self {
            writer: std::sync::Mutex::new(None),
            generation: std::sync::atomic::AtomicU64::new(0),
        }
    }
}

// ── Commands ──────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn compile_and_run(app: tauri::AppHandle, code: String) -> CompileResult {
    use tauri::Manager;

    let tmp_dir = get_tmp_dir(&app);
    let src_file = tmp_dir.join("program.pas");
    let exe_file = tmp_dir.join(if cfg!(target_os = "windows") {
        "program.exe"
    } else {
        "program"
    });

    if let Err(e) = write_file(src_file.to_str().unwrap_or(""), &code) {
        app.emit("console-build-output", format!("{}\n", e)).ok();
        app.emit("console-exit", 1i32).ok();
        return CompileResult {
            success: false,
            output: e,
        };
    }

    // Kill any running process and bump generation before compiling
    let current_gen = {
        let binding = app.state::<ProcessState>();
        binding
            .generation
            .fetch_add(1, std::sync::atomic::Ordering::SeqCst)
            + 1
    };
    {
        let binding = app.state::<ProcessState>();
        let mut guard = binding.writer.lock().unwrap();
        *guard = None;
    }
    // Give the OS time to flush and close the old stdin pipe
    std::thread::sleep(std::time::Duration::from_millis(100));

    let result = compile(&src_file, &tmp_dir);

    app.emit("console-build-output", result.output.clone()).ok();

    if !result.success {
        app.emit("console-exit", 1i32).ok();
        return result;
    }

    // Build succeeded — program is about to start
    app.emit("console-started", ()).ok();

    if cfg!(target_os = "windows") {
        run_with_pipes(&app, &exe_file, &tmp_dir, current_gen).await
    } else {
        run_with_pty(&app, &exe_file, &tmp_dir, current_gen).await
    }
}

#[tauri::command]
pub fn send_input(app: tauri::AppHandle, data: String) {
    use std::io::Write;
    use tauri::Manager;

    let binding = app.state::<ProcessState>();
    let mut guard = binding.writer.lock().unwrap();
    if let Some(writer) = guard.as_mut() {
        let _ = writer.write_all(data.as_bytes());
    }
}

// ── Runners ───────────────────────────────────────────────────────────────────

async fn run_with_pipes(
    app: &tauri::AppHandle,
    exe_file: &std::path::Path,
    tmp_dir: &std::path::Path,
    gen: u64,
) -> CompileResult {
    use std::process::Stdio;
    use tauri::Manager;

    let mut child = match std::process::Command::new(exe_file)
        .current_dir(tmp_dir)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
    {
        Ok(c) => c,
        Err(e) => {
            app.emit("console-program-error", format!("Spawn error: {}\n", e))
                .ok();
            app.emit("console-exit", 1i32).ok();
            return CompileResult {
                success: false,
                output: e.to_string(),
            };
        }
    };

    if let Some(stdin) = child.stdin.take() {
        let binding = app.state::<ProcessState>();
        let mut guard = binding.writer.lock().unwrap();
        *guard = Some(Box::new(stdin));
    }

    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();
    let app_clone = app.clone();

    std::thread::spawn(move || {
        use std::io::Read;
        let mut buf = [0u8; 1024];
        let mut stdout = stdout;
        loop {
            match stdout.read(&mut buf) {
                Ok(0) | Err(_) => break,
                Ok(n) => {
                    let current = app_clone
                        .state::<ProcessState>()
                        .generation
                        .load(std::sync::atomic::Ordering::SeqCst);
                    if current != gen {
                        break;
                    }
                    let data = String::from_utf8_lossy(&buf[..n]).to_string();
                    app_clone.emit("console-program-output", data).ok();
                }
            }
        }
    });

    let app_clone2 = app.clone();
    std::thread::spawn(move || {
        use std::io::Read;
        let mut buf = [0u8; 1024];
        let mut stderr = stderr;
        loop {
            match stderr.read(&mut buf) {
                Ok(0) | Err(_) => break,
                Ok(n) => {
                    let current = app_clone2
                        .state::<ProcessState>()
                        .generation
                        .load(std::sync::atomic::Ordering::SeqCst);
                    if current != gen {
                        break;
                    }
                    let data = String::from_utf8_lossy(&buf[..n]).to_string();
                    app_clone2.emit("console-program-error", data).ok();
                }
            }
        }
    });

    let app_clone3 = app.clone();
    std::thread::spawn(move || {
        use tauri::Manager;

        let exit_code = child
            .wait()
            .map(|s| if s.success() { 0i32 } else { 1i32 })
            .unwrap_or(1);

        let current = app_clone3
            .state::<ProcessState>()
            .generation
            .load(std::sync::atomic::Ordering::SeqCst);
        if current == gen {
            app_clone3.emit("console-exit", exit_code).ok();
        }

        let binding = app_clone3.state::<ProcessState>();
        let mut guard = binding.writer.lock().unwrap();
        *guard = None;
    });

    CompileResult {
        success: true,
        output: String::new(),
    }
}

async fn run_with_pty(
    app: &tauri::AppHandle,
    exe_file: &std::path::Path,
    tmp_dir: &std::path::Path,
    gen: u64,
) -> CompileResult {
    use portable_pty::{native_pty_system, CommandBuilder, PtySize};
    use tauri::Manager;

    let pty_system = native_pty_system();
    let pair = match pty_system.openpty(PtySize {
        rows: 24,
        cols: 80,
        pixel_width: 0,
        pixel_height: 0,
    }) {
        Ok(p) => p,
        Err(e) => {
            app.emit("console-program-error", format!("PTY error: {}\n", e))
                .ok();
            app.emit("console-exit", 1i32).ok();
            return CompileResult {
                success: false,
                output: e.to_string(),
            };
        }
    };

    let mut cmd = CommandBuilder::new(exe_file.to_str().unwrap_or(""));
    cmd.cwd(tmp_dir);

    let mut child = match pair.slave.spawn_command(cmd) {
        Ok(c) => c,
        Err(e) => {
            app.emit("console-program-error", format!("Spawn error: {}\n", e))
                .ok();
            app.emit("console-exit", 1i32).ok();
            return CompileResult {
                success: false,
                output: e.to_string(),
            };
        }
    };

    let writer = pair.master.take_writer().unwrap();
    {
        let binding = app.state::<ProcessState>();
        let mut guard = binding.writer.lock().unwrap();
        *guard = Some(writer);
    }

    let reader = pair.master.try_clone_reader().unwrap();
    let app_clone = app.clone();

    std::thread::spawn(move || {
        let mut buf = [0u8; 4096];
        let mut reader = reader;
        loop {
            match std::io::Read::read(&mut reader, &mut buf) {
                Ok(0) | Err(_) => break,
                Ok(n) => {
                    let current = app_clone
                        .state::<ProcessState>()
                        .generation
                        .load(std::sync::atomic::Ordering::SeqCst);
                    if current != gen {
                        break;
                    }
                    let data = String::from_utf8_lossy(&buf[..n]).to_string();
                    app_clone.emit("console-program-output", data).ok();
                }
            }
        }

        let exit_code = child
            .wait()
            .map(|s| if s.success() { 0i32 } else { 1i32 })
            .unwrap_or(1);

        let current = app_clone
            .state::<ProcessState>()
            .generation
            .load(std::sync::atomic::Ordering::SeqCst);
        if current == gen {
            app_clone.emit("console-exit", exit_code).ok();
        }

        let binding = app_clone.state::<ProcessState>();
        let mut guard = binding.writer.lock().unwrap();
        *guard = None;
    });

    CompileResult {
        success: true,
        output: String::new(),
    }
}
