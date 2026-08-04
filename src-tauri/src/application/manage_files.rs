use tauri::AppHandle;

use crate::project::files::{self, SaveResult};

pub async fn open_file(app: AppHandle) -> Option<(String, String)> {
    files::open_file(&app).await
}

pub fn save_file(content: String, file_path: String) -> Result<SaveResult, String> {
    files::save_file(&content, &file_path)
}

pub async fn save_file_as(
    app: AppHandle,
    content: String,
    suggested_name: String,
    folder_path: Option<String>,
) -> Option<SaveResult> {
    files::save_file_as(&app, &content, &suggested_name, folder_path).await
}

pub fn file_exists(path: String) -> bool {
    files::file_exists(&path)
}

pub fn read_file(path: String) -> Result<String, String> {
    files::read_file(&path)
}

pub fn delete_file(path: String) -> Result<(), String> {
    files::delete_file(&path)
}
