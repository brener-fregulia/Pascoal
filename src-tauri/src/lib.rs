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

fn detect_fpc() -> (bool, Option<String>) {
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

fn get_documents_dir(app: &tauri::AppHandle) -> std::path::PathBuf {
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
    std::fs::write(&file_path, content).map_err(|e| e.to_string())?;
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
    std::fs::write(&path_str, content).ok()?;

    Some(SaveResult { path: path_str })
}

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
            file_exists
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}

#[tauri::command]
fn file_exists(path: String) -> bool {
    std::path::Path::new(&path).exists()
}
