use crate::infrastructure::git;

#[tauri::command]
pub fn git_status(folder_path: String) -> git::GitStatusResult {
    git::status(&folder_path)
}

#[tauri::command]
pub fn git_diff(folder_path: String, file_path: String, staged: bool) -> Result<String, String> {
    git::diff(&folder_path, &file_path, staged)
}

#[tauri::command]
pub fn git_stage(folder_path: String, file_path: String) -> Result<(), String> {
    git::stage(&folder_path, &file_path)
}

#[tauri::command]
pub fn git_unstage(folder_path: String, file_path: String) -> Result<(), String> {
    git::unstage(&folder_path, &file_path)
}

#[tauri::command]
pub fn git_stage_all(folder_path: String) -> Result<(), String> {
    git::stage_all(&folder_path)
}

#[tauri::command]
pub fn git_unstage_all(folder_path: String) -> Result<(), String> {
    git::unstage_all(&folder_path)
}

#[tauri::command]
pub fn git_commit(folder_path: String, message: String) -> Result<(), String> {
    git::commit(&folder_path, &message)
}

#[tauri::command]
pub fn git_init(folder_path: String) -> Result<(), String> {
    git::init(&folder_path)
}

#[tauri::command]
pub fn git_check_identity(folder_path: String) -> git::GitIdentity {
    git::check_identity(&folder_path)
}

#[tauri::command]
pub fn git_set_identity(
    folder_path: String,
    name: String,
    email: String,
    global: bool,
) -> Result<(), String> {
    git::set_identity(&folder_path, &name, &email, global)
}

#[tauri::command]
pub fn git_check_global_identity() -> git::GitIdentity {
    git::check_global_identity()
}

#[tauri::command]
pub fn git_check_local_identity(folder_path: String) -> git::GitIdentity {
    git::check_local_identity(&folder_path)
}

#[tauri::command]
pub fn git_set_global_identity(name: String, email: String) -> Result<(), String> {
    git::set_global_identity(&name, &email)
}

#[tauri::command]
pub fn git_show_file(
    folder_path: String,
    revision: String,
    file_path: String,
) -> Result<String, String> {
    git::show_file(&folder_path, &revision, &file_path)
}

#[tauri::command]
pub fn git_discard(folder_path: String, file_path: String) -> Result<(), String> {
    git::discard(&folder_path, &file_path)
}

#[tauri::command]
pub fn git_get_remote(folder_path: String) -> Option<String> {
    git::get_remote(&folder_path)
}

#[tauri::command]
pub fn git_set_remote(folder_path: String, url: String) -> Result<(), String> {
    git::set_remote(&folder_path, &url)
}

#[tauri::command]
pub fn git_push(folder_path: String, branch: String) -> Result<String, String> {
    git::push(&folder_path, &branch)
}

#[tauri::command]
pub fn git_pull(folder_path: String, branch: String) -> Result<String, String> {
    git::pull(&folder_path, &branch)
}
