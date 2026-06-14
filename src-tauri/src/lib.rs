use tauri::Manager;

#[derive(serde::Serialize)]
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

// ── App setup ────────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}

// ── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    mod fpc_tests {
        use super::*;

        #[test]
        fn detect_fpc_returns_tuple() {
            let (installed, version) = detect_fpc();
            if installed {
                assert!(version.is_some(), "FPC installed but version is None");
                let v = version.unwrap();
                assert!(!v.is_empty(), "FPC version string should not be empty");
            } else {
                assert!(version.is_none(), "FPC not installed but version is Some");
            }
        }

        #[test]
        fn detect_fpc_does_not_panic() {
            let result = std::panic::catch_unwind(detect_fpc);
            assert!(result.is_ok(), "detect_fpc should never panic");
        }
    }

    mod file_tests {
        use super::*;
        use std::fs;

        #[test]
        fn file_exists_returns_true_for_existing_file() {
            let tmp = std::env::temp_dir().join("pascoal_test_exists.pas");
            fs::write(&tmp, "program Test;").unwrap();
            assert!(check_file_exists(&tmp.to_string_lossy()));
            fs::remove_file(tmp).unwrap();
        }

        #[test]
        fn file_exists_returns_false_for_missing_file() {
            assert!(!check_file_exists(
                "/nonexistent/path/that/does/not/exist/file.pas"
            ));
        }

        #[test]
        fn write_file_writes_content() {
            let tmp = std::env::temp_dir().join("pascoal_test_save.pas");
            let content = "program HelloWorld;\nbegin\n  writeln('Hello');\nend.";
            let path = tmp.to_string_lossy().to_string();

            let result = write_file(&path, content);

            assert!(result.is_ok());
            assert_eq!(fs::read_to_string(&tmp).unwrap(), content);
            fs::remove_file(tmp).unwrap();
        }

        #[test]
        fn write_file_fails_for_invalid_path() {
            let result = write_file("/nonexistent/deep/path/file.pas", "content");
            assert!(result.is_err());
        }
    }
}
