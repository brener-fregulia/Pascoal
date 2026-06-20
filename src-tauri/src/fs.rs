use crate::env::get_documents_dir;

#[derive(serde::Serialize)]
pub struct SaveResult {
    pub path: String,
}

pub fn check_file_exists(path: &str) -> bool {
    std::path::Path::new(path).exists()
}

pub fn write_file(path: &str, content: &str) -> Result<(), String> {
    std::fs::write(path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn open_file(app: tauri::AppHandle) -> Option<(String, String)> {
    use tauri_plugin_dialog::DialogExt;

    let default_dir = get_documents_dir(&app);

    let path = app
        .dialog()
        .file()
        .set_directory(default_dir)
        .add_filter("Pascal", &["pas"])
        .blocking_pick_file()?;

    let path_str = path.to_string();
    let content = std::fs::read_to_string(&path_str).ok()?;

    Some((path_str, content))
}

#[tauri::command]
pub async fn save_file(content: String, file_path: String) -> Result<SaveResult, String> {
    write_file(&file_path, &content)?;
    Ok(SaveResult { path: file_path })
}

#[tauri::command]
pub async fn save_file_as(
    app: tauri::AppHandle,
    content: String,
    suggested_name: String,
) -> Option<SaveResult> {
    use tauri_plugin_dialog::DialogExt;

    let default_dir = get_documents_dir(&app);

    let path = app
        .dialog()
        .file()
        .set_directory(default_dir)
        .set_file_name(&suggested_name)
        .add_filter("Pascal", &["pas"])
        .blocking_save_file()?;

    let path_str = path.to_string();
    write_file(&path_str, &content).ok()?;

    Some(SaveResult { path: path_str })
}

#[tauri::command]
pub fn file_exists(path: String) -> bool {
    check_file_exists(&path)
}
