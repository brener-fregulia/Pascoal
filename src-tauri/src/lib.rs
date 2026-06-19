use tauri::Emitter;
use tauri::Manager;

// ── Structs ──────────────────────────────────────────────────────────────────

#[derive(serde::Serialize, Clone)]
pub struct AppInfo {
    name: String,
    version: String,
    fpc_installed: bool,
    fpc_version: Option<String>,
    platform: String,
    documents_dir: String,
}

#[derive(serde::Serialize)]
pub struct SaveResult {
    path: String,
}

#[derive(serde::Serialize, Clone)]
pub struct CompileResult {
    success: bool,
    output: String,
}

// ── FPC detection ────────────────────────────────────────────────────────────

pub fn detect_fpc() -> (bool, Option<String>) {
    let output = std::process::Command::new("fpc").arg("-iV").output();

    match output {
        Ok(o) if o.status.success() => {
            let version = String::from_utf8(o.stdout)
                .ok()
                .map(|s| s.trim().to_string());
            (true, version)
        }
        _ => (false, None),
    }
}

// ── Documents directory ───────────────────────────────────────────────────────

pub fn get_documents_dir(app: &tauri::AppHandle) -> std::path::PathBuf {
    let docs = app
        .path()
        .document_dir()
        .unwrap_or_else(|_| std::path::PathBuf::from("."));
    let pascoal_dir = docs.join("Pascoal");
    if !pascoal_dir.exists() {
        let _ = std::fs::create_dir_all(&pascoal_dir);
    }
    pascoal_dir
}

// ── Pure functions (testable) ─────────────────────────────────────────────────

pub fn check_file_exists(path: &str) -> bool {
    std::path::Path::new(path).exists()
}

pub fn write_file(path: &str, content: &str) -> Result<(), String> {
    std::fs::write(path, content).map_err(|e| e.to_string())
}

// ── Compiler ─────────────────────────────────────────────────────────────────

fn get_tmp_dir(app: &tauri::AppHandle) -> std::path::PathBuf {
    let tmp = app
        .path()
        .app_cache_dir()
        .unwrap_or_else(|_| std::env::temp_dir());
    let dir = tmp.join("pascoal-build");
    if !dir.exists() {
        let _ = std::fs::create_dir_all(&dir);
    }
    dir
}

fn fpc_bin() -> &'static str {
    if cfg!(target_os = "windows") {
        "fpc.exe"
    } else {
        "fpc"
    }
}

pub fn compile(src_file: &std::path::Path, out_dir: &std::path::Path) -> CompileResult {
    let exe = out_dir.join(if cfg!(target_os = "windows") {
        "program.exe"
    } else {
        "program"
    });

    if exe.exists() {
        #[cfg(target_os = "windows")]
        std::thread::sleep(std::time::Duration::from_millis(200));
        let _ = std::fs::remove_file(&exe);
    }

    let output = std::process::Command::new(fpc_bin())
        .args([
            src_file.to_str().unwrap_or(""),
            &format!("-FE{}", out_dir.to_str().unwrap_or("")),
            &format!("-o{}", exe.to_str().unwrap_or("")),
        ])
        .current_dir(out_dir)
        .output();

    match output {
        Ok(o) => {
            let text = format!(
                "{}{}",
                String::from_utf8_lossy(&o.stdout),
                String::from_utf8_lossy(&o.stderr)
            );
            CompileResult {
                success: o.status.success() && exe.exists(),
                output: text,
            }
        }
        Err(e) => CompileResult {
            success: false,
            output: format!("Failed to run FPC: {}", e),
        },
    }
}

// ── Process state ─────────────────────────────────────────────────────────────

struct ProcessState {
    writer: std::sync::Mutex<Option<Box<dyn std::io::Write + Send>>>,
}

impl ProcessState {
    fn new() -> Self {
        Self {
            writer: std::sync::Mutex::new(None),
        }
    }
}

// ── Commands ─────────────────────────────────────────────────────────────────

#[tauri::command]
fn get_app_info(app: tauri::AppHandle) -> AppInfo {
    let (fpc_installed, fpc_version) = detect_fpc();
    AppInfo {
        name: app.package_info().name.clone(),
        version: app.package_info().version.to_string(),
        fpc_installed,
        fpc_version,
        platform: std::env::consts::OS.to_string(),
        documents_dir: get_documents_dir(&app).to_string_lossy().to_string(),
    }
}

#[tauri::command]
async fn open_file(app: tauri::AppHandle) -> Option<(String, String)> {
    use tauri_plugin_dialog::DialogExt;

    let default_dir = get_documents_dir(&app);

    let path = app
        .dialog()
        .file()
        .set_directory(default_dir)
        .add_filter("Pascal", &["pas"])
        .blocking_pick_file()?;

    let path_str = path.to_string();
    let content = std::fs::read_to_string(&path_str).ok()?;

    Some((path_str, content))
}

#[tauri::command]
async fn save_file(content: String, file_path: String) -> Result<SaveResult, String> {
    write_file(&file_path, &content)?;
    Ok(SaveResult { path: file_path })
}

#[tauri::command]
async fn save_file_as(
    app: tauri::AppHandle,
    content: String,
    suggested_name: String,
) -> Option<SaveResult> {
    use tauri_plugin_dialog::DialogExt;

    let default_dir = get_documents_dir(&app);

    let path = app
        .dialog()
        .file()
        .set_directory(default_dir)
        .set_file_name(&suggested_name)
        .add_filter("Pascal", &["pas"])
        .blocking_save_file()?;

    let path_str = path.to_string();
    write_file(&path_str, &content).ok()?;

    Some(SaveResult { path: path_str })
}

#[tauri::command]
fn file_exists(path: String) -> bool {
    check_file_exists(&path)
}

#[tauri::command]
async fn compile_and_run(app: tauri::AppHandle, code: String) -> CompileResult {
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

    // Kill any running process before compiling
    {
        let binding = app.state::<ProcessState>();
        let mut guard = binding.writer.lock().unwrap();
        *guard = None;
    }

    let result = compile(&src_file, &tmp_dir);

    // Build messages go to the dedicated build channel
    app.emit("console-build-output", result.output.clone()).ok();

    if !result.success {
        app.emit("console-exit", 1i32).ok();
        return result;
    }

    // Build succeeded — program is about to start
    app.emit("console-started", ()).ok();

    if cfg!(target_os = "windows") {
        run_with_pipes(&app, &exe_file, &tmp_dir).await
    } else {
        run_with_pty(&app, &exe_file, &tmp_dir).await
    }
}

async fn run_with_pipes(
    app: &tauri::AppHandle,
    exe_file: &std::path::Path,
    tmp_dir: &std::path::Path,
) -> CompileResult {
    use std::process::Stdio;

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

    // Store stdin for input
    if let Some(stdin) = child.stdin.take() {
        let binding = app.state::<ProcessState>();
        let mut guard = binding.writer.lock().unwrap();
        *guard = Some(Box::new(stdin));
    }

    // Stream stdout
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
                    let data = String::from_utf8_lossy(&buf[..n]).to_string();
                    app_clone.emit("console-program-output", data).ok();
                }
            }
        }
    });

    // Stream stderr
    let app_clone2 = app.clone();
    std::thread::spawn(move || {
        use std::io::Read;
        let mut buf = [0u8; 1024];
        let mut stderr = stderr;
        loop {
            match stderr.read(&mut buf) {
                Ok(0) | Err(_) => break,
                Ok(n) => {
                    let data = String::from_utf8_lossy(&buf[..n]).to_string();
                    app_clone2.emit("console-program-error", data).ok();
                }
            }
        }
    });

    // Wait for exit
    let app_clone3 = app.clone();
    std::thread::spawn(move || {
        let exit_code = child
            .wait()
            .map(|s| if s.success() { 0i32 } else { 1i32 })
            .unwrap_or(1);
        app_clone3.emit("console-exit", exit_code).ok();

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
) -> CompileResult {
    use portable_pty::{native_pty_system, CommandBuilder, PtySize};

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
                    let data = String::from_utf8_lossy(&buf[..n]).to_string();
                    app_clone.emit("console-program-output", data).ok();
                }
            }
        }

        let exit_code = child
            .wait()
            .map(|s| if s.success() { 0i32 } else { 1i32 })
            .unwrap_or(1);
        app_clone.emit("console-exit", exit_code).ok();

        let binding = app_clone.state::<ProcessState>();
        let mut guard = binding.writer.lock().unwrap();
        *guard = None;
    });

    CompileResult {
        success: true,
        output: String::new(),
    }
}

#[tauri::command]
fn send_input(app: tauri::AppHandle, data: String) {
    use std::io::Write;
    let binding = app.state::<ProcessState>();
    let mut guard = binding.writer.lock().unwrap();
    if let Some(writer) = guard.as_mut() {
        let _ = writer.write_all(data.as_bytes());
    }
}

// ── App setup ────────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(ProcessState::new())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            app.handle().plugin(tauri_plugin_dialog::init())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_app_info,
            open_file,
            save_file,
            save_file_as,
            file_exists,
            compile_and_run,
            send_input,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}

// ── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests;
