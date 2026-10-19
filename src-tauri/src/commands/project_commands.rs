use crate::application::{manage_files, manage_workspace};
use crate::project::files::{ExplorerNode, OpenFolderResult, SaveResult};
use crate::project::search::SearchMatch;

#[tauri::command]
pub async fn open_file(app: tauri::AppHandle) -> Option<(String, String)> {
    manage_files::open_file(app).await
}

#[tauri::command]
pub async fn save_file(content: String, file_path: String) -> Result<SaveResult, String> {
    manage_files::save_file(content, file_path)
}

#[tauri::command]
pub async fn save_file_as(
    app: tauri::AppHandle,
    content: String,
    suggested_name: String,
    folder_path: Option<String>,
) -> Option<SaveResult> {
    manage_files::save_file_as(app, content, suggested_name, folder_path).await
}

#[tauri::command(async)]
pub fn file_exists(path: String) -> bool {
    manage_files::file_exists(path)
}

#[tauri::command(async)]
pub fn read_file(path: String) -> Result<String, String> {
    manage_files::read_file(path)
}

#[tauri::command(async)]
pub fn open_url(app: tauri::AppHandle, url: String) -> Result<(), String> {
    manage_files::open_url(app, url)
}

#[tauri::command(async)]
pub fn reveal_in_file_manager(app: tauri::AppHandle, path: String) -> Result<(), String> {
    manage_files::reveal_in_file_manager(app, path)
}

#[tauri::command]
pub async fn open_workspace(app: tauri::AppHandle) -> Option<OpenFolderResult> {
    manage_workspace::open_workspace(app).await
}

#[tauri::command(async)]
pub fn open_workspace_at_path(
    app: tauri::AppHandle,
    path: String,
) -> Result<OpenFolderResult, String> {
    manage_workspace::open_workspace_at_path(app, path)
}

#[tauri::command(async)]
pub fn list_folder_tree(folder_path: String) -> Vec<ExplorerNode> {
    manage_workspace::list_folder_tree(folder_path)
}

#[tauri::command(async)]
pub fn search_in_folder(
    folder_path: String,
    query: String,
    case_sensitive: bool,
) -> Vec<SearchMatch> {
    manage_workspace::search_in_folder(folder_path, query, case_sensitive)
}

#[tauri::command(async)]
pub fn delete_file(path: String) -> Result<(), String> {
    manage_files::delete_file(path)
}

#[tauri::command(async)]
pub fn create_file(
    app: tauri::AppHandle,
    parent_path: String,
    name: String,
) -> Result<String, String> {
    manage_workspace::create_file(app, parent_path, name)
}

#[tauri::command(async)]
pub fn create_directory(
    app: tauri::AppHandle,
    parent_path: String,
    name: String,
) -> Result<String, String> {
    manage_workspace::create_directory(app, parent_path, name)
}

#[tauri::command(async)]
pub fn rename_path(
    app: tauri::AppHandle,
    path: String,
    new_name: String,
) -> Result<String, String> {
    manage_workspace::rename_path(app, path, new_name)
}

#[tauri::command(async)]
pub fn trash_path(app: tauri::AppHandle, path: String) -> Result<(), String> {
    manage_workspace::trash_path(app, path)
}

#[tauri::command(async)]
pub fn delete_path_permanently(app: tauri::AppHandle, path: String) -> Result<(), String> {
    manage_workspace::delete_path_permanently(app, path)
}

#[tauri::command(async)]
pub fn copy_path(
    app: tauri::AppHandle,
    path: String,
    destination_parent: String,
) -> Result<String, String> {
    manage_workspace::copy_path(app, path, destination_parent)
}

#[tauri::command(async)]
pub fn move_path(
    app: tauri::AppHandle,
    path: String,
    destination_parent: String,
) -> Result<String, String> {
    manage_workspace::move_path(app, path, destination_parent)
}
