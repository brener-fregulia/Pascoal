use tauri::{AppHandle, Manager};

use crate::infrastructure::settings;

fn settings_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    app.path()
        .app_config_dir()
        .map(|dir| dir.join("settings.json"))
        .map_err(|e| e.to_string())
}

pub fn load_settings(app: &AppHandle) -> Result<String, String> {
    let path = settings_path(app)?;
    settings::read(&path)
}

pub fn save_settings(app: &AppHandle, content: &str) -> Result<(), String> {
    let path = settings_path(app)?;
    settings::write(&path, content)
}
