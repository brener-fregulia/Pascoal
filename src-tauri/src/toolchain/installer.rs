use tauri::Emitter;

// ── Detection ─────────────────────────────────────────────────────────────────

fn command_exists(cmd: &str) -> bool {
    let checker = if cfg!(target_os = "windows") {
        "where"
    } else {
        "which"
    };
    crate::infrastructure::platform::no_window(std::process::Command::new(checker))
        .arg(cmd)
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

pub fn detect_package_manager() -> Option<&'static str> {
    if cfg!(target_os = "windows") {
        return command_exists("winget").then_some("winget");
    }

    if cfg!(target_os = "linux") {
        for pm in ["apt-get", "pacman", "dnf", "zypper"] {
            if command_exists(pm) {
                return Some(pm);
            }
        }
    }

    None
}

pub fn install_command(pm: &str) -> Option<(&'static str, &'static [&'static str])> {
    match pm {
        "winget" => Some((
            "winget",
            &[
                "install",
                "--id",
                "FreePascal.FreePascalCompiler",
                "-e",
                "--accept-source-agreements",
                "--accept-package-agreements",
            ],
        )),
        "apt-get" => Some(("pkexec", &["apt-get", "install", "-y", "fpc"])),
        "pacman" => Some(("pkexec", &["pacman", "-S", "--noconfirm", "fpc"])),
        "dnf" => Some(("pkexec", &["dnf", "install", "-y", "fpc"])),
        "zypper" => Some(("pkexec", &["zypper", "install", "-y", "fpc"])),
        _ => None,
    }
}

// ── Execution ─────────────────────────────────────────────────────────────────

/// Runs the install command and emits fpc-install-* progress events.
/// Blocking - callers run this on a background thread.
pub fn run_install(app: tauri::AppHandle, program: &'static str, args: &'static [&'static str]) {
    use std::io::Read;
    use std::process::Stdio;

    let child = crate::infrastructure::platform::no_window(std::process::Command::new(program))
        .args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn();

    let mut child = match child {
        Ok(c) => c,
        Err(e) => {
            app.emit("fpc-install-output", format!("{}\n", e)).ok();
            app.emit("fpc-install-error", e.to_string()).ok();
            return;
        }
    };

    let stdout = child.stdout.take();
    let stderr = child.stderr.take();

    let out_handle = stdout.map(|mut pipe| {
        let app = app.clone();
        std::thread::spawn(move || {
            let mut buf = [0u8; 1024];
            loop {
                match pipe.read(&mut buf) {
                    Ok(0) | Err(_) => break,
                    Ok(n) => {
                        let data = String::from_utf8_lossy(&buf[..n]).to_string();
                        app.emit("fpc-install-output", data).ok();
                    }
                }
            }
        })
    });

    let err_handle = stderr.map(|mut pipe| {
        let app = app.clone();
        std::thread::spawn(move || {
            let mut buf = [0u8; 1024];
            loop {
                match pipe.read(&mut buf) {
                    Ok(0) | Err(_) => break,
                    Ok(n) => {
                        let data = String::from_utf8_lossy(&buf[..n]).to_string();
                        app.emit("fpc-install-output", data).ok();
                    }
                }
            }
        })
    });

    let status = child.wait();

    if let Some(h) = out_handle {
        let _ = h.join();
    }
    if let Some(h) = err_handle {
        let _ = h.join();
    }

    match status {
        Ok(s) if s.success() => {
            app.emit("fpc-install-done", ()).ok();
        }
        Ok(s) => {
            app.emit(
                "fpc-install-error",
                format!("exit code {}", s.code().unwrap_or(-1)),
            )
            .ok();
        }
        Err(e) => {
            app.emit("fpc-install-error", e.to_string()).ok();
        }
    }
}
