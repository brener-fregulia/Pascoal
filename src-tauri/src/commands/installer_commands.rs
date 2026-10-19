use crate::application::install_toolchain;

#[tauri::command(async)]
pub fn detect_installer() -> Option<String> {
    install_toolchain::detect_installer()
}

#[tauri::command(async)]
pub fn install_fpc(app: tauri::AppHandle) -> Result<(), String> {
    install_toolchain::install_fpc(app)
}
