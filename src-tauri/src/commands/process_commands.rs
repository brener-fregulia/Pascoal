use crate::application::run_program;
use crate::compiler::CompileResult;

#[tauri::command]
pub async fn compile_and_run(app: tauri::AppHandle, code: String) -> CompileResult {
    run_program::run_program(app, code).await
}

#[tauri::command]
pub fn send_input(app: tauri::AppHandle, data: String) {
    run_program::send_input(app, data)
}
