use crate::state::ProcessState;
use crate::toolchain::compiler::CompileResult;
use tauri::Emitter;

pub async fn run_with_pipes(
    app: &tauri::AppHandle,
    exe_file: &std::path::Path,
    tmp_dir: &std::path::Path,
    gen: u64,
) -> CompileResult {
    use std::process::Stdio;
    use tauri::Manager;

    let mut child =
        match crate::infrastructure::platform::no_window(std::process::Command::new(exe_file))
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
    {
        let binding = app.state::<ProcessState>();
        let mut guard = binding.pid.lock().unwrap();
        *guard = Some(child.id());
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
        let mut pid_guard = binding.pid.lock().unwrap();
        *pid_guard = None;
    });

    CompileResult {
        success: true,
        output: String::new(),
    }
}

#[cfg(unix)]
fn disable_pty_echo(pair: &portable_pty::PtyPair) {
    use termios::{tcsetattr, Termios, ECHO, ECHOE, ECHOK, ECHONL, TCSANOW};

    if let Some(fd) = pair.master.as_raw_fd() {
        if let Ok(mut attrs) = Termios::from_fd(fd) {
            attrs.c_lflag &= !(ECHO | ECHOE | ECHOK | ECHONL);
            let _ = tcsetattr(fd, TCSANOW, &attrs);
        }
    }
}

pub async fn run_with_pty(
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

    // Console.svelte already echoes typed characters itself, matching
    // the plain-pipes Windows path (run_with_pipes), which has no echo
    // of its own. A real PTY's kernel line discipline echoes input by
    // default though, so without this every keystroke shows up twice
    // on Linux.
    #[cfg(unix)]
    disable_pty_echo(&pair);

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

    // Drop slave immediately after spawning - prevents terminal escape leakage
    drop(pair.slave);

    let writer = pair.master.take_writer().unwrap();
    {
        let binding = app.state::<ProcessState>();
        let mut guard = binding.writer.lock().unwrap();
        *guard = Some(writer);
    }
    {
        let binding = app.state::<ProcessState>();
        let mut guard = binding.pid.lock().unwrap();
        *guard = child.process_id();
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
        let mut pid_guard = binding.pid.lock().unwrap();
        *pid_guard = None;
    });

    CompileResult {
        success: true,
        output: String::new(),
    }
}
