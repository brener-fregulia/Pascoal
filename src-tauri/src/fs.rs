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
pub async fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
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

#[derive(serde::Serialize)]
pub struct ExplorerFile {
    pub name: String,
    pub path: String,
    pub relative_path: String,
}

#[derive(serde::Serialize)]
pub struct ExplorerFolder {
    pub name: String,
    pub path: String,
}

#[derive(serde::Serialize)]
pub struct OpenFolderResult {
    pub folder: ExplorerFolder,
    pub files: Vec<ExplorerFile>,
}

fn collect_pas_files(dir: &std::path::Path, root: &std::path::Path) -> Vec<ExplorerFile> {
    let mut files = Vec::new();

    let entries = match std::fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return files,
    };

    let mut sorted: Vec<_> = entries.flatten().collect();
    sorted.sort_by_key(|e| e.file_name());

    for entry in sorted {
        let path = entry.path();
        let file_type = match entry.file_type() {
            Ok(ft) => ft,
            Err(_) => continue,
        };

        if file_type.is_file() {
            if path.extension().and_then(|e| e.to_str()) == Some("pas") {
                let name = path
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("")
                    .to_string();

                let relative_path = path
                    .strip_prefix(root)
                    .unwrap_or(&path)
                    .to_string_lossy()
                    .to_string();

                files.push(ExplorerFile {
                    name,
                    path: path.to_string_lossy().to_string(),
                    relative_path,
                });
            }
        }
    }

    files
}

#[tauri::command]
pub async fn open_folder(app: tauri::AppHandle) -> Option<OpenFolderResult> {
    use tauri_plugin_dialog::DialogExt;

    let path = app.dialog().file().blocking_pick_folder()?;

    let folder_path = std::path::PathBuf::from(path.to_string());

    let name = folder_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Folder")
        .to_string();

    let files = collect_pas_files(&folder_path, &folder_path);

    Some(OpenFolderResult {
        folder: ExplorerFolder {
            name,
            path: folder_path.to_string_lossy().to_string(),
        },
        files,
    })
}

#[tauri::command]
pub fn list_folder_files(folder_path: String) -> Vec<ExplorerFile> {
    let path = std::path::PathBuf::from(&folder_path);
    collect_pas_files(&path, &path)
}

#[tauri::command]
pub fn open_url(url: String) {
    #[cfg(target_os = "windows")]
    let _ = std::process::Command::new("cmd")
        .args(["/c", "start", &url])
        .spawn();
    #[cfg(target_os = "macos")]
    let _ = std::process::Command::new("open").arg(&url).spawn();
    #[cfg(target_os = "linux")]
    let _ = std::process::Command::new("xdg-open").arg(&url).spawn();
}
