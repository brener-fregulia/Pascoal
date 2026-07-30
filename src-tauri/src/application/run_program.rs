use tauri::Emitter;

use crate::compiler::{compile, get_tmp_dir, CompileResult};
use crate::fs::write_file;
use crate::state::ProcessState;
use crate::toolchain::runner::{run_with_pipes, run_with_pty};

/// Use case: compile the given Pascal source and run the resulting binary,
/// emitting console-* events as it progresses. This is the orchestration
/// that used to live directly inside the `compile_and_run` Tauri command.
pub async fn run_program(app: tauri::AppHandle, code: String) -> CompileResult {
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

    // Build succeeded - program is about to start
    app.emit("console-started", ()).ok();

    if cfg!(target_os = "windows") {
        run_with_pipes(&app, &exe_file, &tmp_dir, current_gen).await
    } else {
        run_with_pty(&app, &exe_file, &tmp_dir, current_gen).await
    }
}

/// Use case: forward input bytes to the currently running program's stdin.
pub fn send_input(app: tauri::AppHandle, data: String) {
    use std::io::Write;
    use tauri::Manager;

    let binding = app.state::<ProcessState>();
    let mut guard = binding.writer.lock().unwrap();
    if let Some(writer) = guard.as_mut() {
        let _ = writer.write_all(data.as_bytes());
    }
}
