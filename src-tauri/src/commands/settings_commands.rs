use crate::application::manage_settings;

#[tauri::command]
pub fn load_settings(app: tauri::AppHandle) -> Result<String, String> {
    manage_settings::load_settings(&app)
}

#[tauri::command]
pub fn save_settings(app: tauri::AppHandle, content: String) -> Result<(), String> {
    manage_settings::save_settings(&app, &content)
}
