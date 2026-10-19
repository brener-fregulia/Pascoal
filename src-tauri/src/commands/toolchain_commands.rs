use crate::application::check_toolchain::{self, ToolchainStatus};

#[tauri::command(async)]
pub fn get_toolchain_status() -> ToolchainStatus {
    check_toolchain::get_toolchain_status()
}
