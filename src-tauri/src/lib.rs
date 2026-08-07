mod application;
mod commands;
mod infrastructure;
mod language;
mod project;
mod state;
mod toolchain;

use infrastructure::environment::{detect_fpc, get_documents_dir};
use state::{ProcessState, WorkspaceState};
use tauri::Manager;

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
        .manage(WorkspaceState::new())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            app.handle().plugin(tauri_plugin_dialog::init())?;
            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())?;
            app.handle().plugin(tauri_plugin_process::init())?;
            app.handle().plugin(tauri_plugin_opener::init())?;
            app.handle()
                .plugin(tauri_plugin_window_state::Builder::default().build())?;

            // First-ever launch (no settings.json saved yet) starts
            // maximized. Every launch after that is left entirely to the
            // window-state plugin above - we don't touch it again.
            let is_first_launch = app
                .path()
                .app_config_dir()
                .map(|dir| !dir.join("settings.json").exists())
                .unwrap_or(true);

            if is_first_launch {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.maximize();
                }
            }

            #[cfg(feature = "e2e")]
            app.handle().plugin(tauri_plugin_wdio_webdriver::init())?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_app_info,
            commands::project_commands::open_file,
            commands::project_commands::save_file,
            commands::project_commands::save_file_as,
            commands::project_commands::file_exists,
            commands::project_commands::read_file,
            commands::project_commands::open_workspace,
            commands::project_commands::open_workspace_at_path,
            commands::project_commands::list_folder_tree,
            commands::project_commands::open_url,
            commands::project_commands::reveal_in_file_manager,
            commands::project_commands::search_in_folder,
            commands::git_commands::git_status,
            commands::git_commands::git_diff,
            commands::git_commands::git_stage,
            commands::git_commands::git_unstage,
            commands::git_commands::git_stage_all,
            commands::git_commands::git_unstage_all,
            commands::git_commands::git_commit,
            commands::git_commands::git_init,
            commands::git_commands::git_check_identity,
            commands::git_commands::git_set_identity,
            commands::git_commands::git_check_global_identity,
            commands::git_commands::git_check_local_identity,
            commands::git_commands::git_set_global_identity,
            commands::git_commands::git_show_file,
            commands::git_commands::git_discard,
            commands::git_commands::git_get_remote,
            commands::git_commands::git_set_remote,
            commands::git_commands::git_push,
            commands::git_commands::git_pull,
            commands::git_commands::git_ahead_behind,
            commands::git_commands::git_fetch,
            commands::git_commands::git_ahead_behind,
            commands::project_commands::delete_file,
            commands::process_commands::compile_and_run,
            commands::process_commands::send_input,
            commands::installer_commands::detect_installer,
            commands::installer_commands::install_fpc,
            commands::language_commands::highlight_pascal,
            commands::settings_commands::load_settings,
            commands::settings_commands::save_settings,
            commands::toolchain_commands::get_toolchain_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests;
