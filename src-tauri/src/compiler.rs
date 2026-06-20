use tauri::Manager;

#[derive(serde::Serialize, Clone)]
pub struct CompileResult {
    pub success: bool,
    pub output: String,
}

pub fn get_tmp_dir(app: &tauri::AppHandle) -> std::path::PathBuf {
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
