mod compiler;
mod env;
mod fs;
mod process;

use env::{detect_fpc, get_documents_dir};
use process::ProcessState;

// ── Structs ───────────────────────────────────────────────────────────────────

#[derive(serde::Serialize, Clone)]
pub struct AppInfo {
    name: String,
    version: String,
    fpc_installed: bool,
    fpc_version: Option<String>,
    platform: String,
    documents_dir: String,
}

// ── Commands ──────────────────────────────────────────────────────────────────

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

// ── App setup ─────────────────────────────────────────────────────────────────

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
            fs::open_file,
            fs::save_file,
            fs::save_file_as,
            fs::file_exists,
            fs::read_file,
            fs::open_folder,
            fs::list_folder_files,
            fs::open_url,
            fs::search_in_folder,
            process::compile_and_run,
            process::send_input,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests;
