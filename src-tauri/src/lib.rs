#[derive(serde::Serialize)]
pub struct AppInfo {
    name: String,
    version: String,
    fpc_installed: bool,
    fpc_version: Option<String>,
    platform: String,
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

#[tauri::command]
fn get_app_info(app: tauri::AppHandle) -> AppInfo {
    let (fpc_installed, fpc_version) = detect_fpc();
    AppInfo {
        name: app.package_info().name.clone(),
        version: app.package_info().version.to_string(),
        fpc_installed,
        fpc_version,
        platform: std::env::consts::OS.to_string(),
    }
}

#[tauri::command]
async fn open_file(app: tauri::AppHandle) -> Option<(String, String)> {
    use tauri_plugin_dialog::DialogExt;

    let path = app
        .dialog()
        .file()
        .add_filter("Pascal", &["pas"])
        .blocking_pick_file()?;

    let path_str = path.to_string();
    let content = std::fs::read_to_string(&path_str).ok()?;

    Some((path_str, content))
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
        .invoke_handler(tauri::generate_handler![get_app_info, open_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}
