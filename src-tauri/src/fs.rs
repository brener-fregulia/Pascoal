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
    folder_path: Option<String>,
) -> Option<SaveResult> {
    use tauri_plugin_dialog::DialogExt;

    let default_dir = match folder_path {
        Some(p) => std::path::PathBuf::from(p),
        None => get_documents_dir(&app),
    };

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

#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
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

// ── Explorer ──────────────────────────────────────────────────────────────────

const IGNORED_DIRS: &[&str] = &[".git"];

#[derive(serde::Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ExplorerNode {
    pub name: String,
    pub path: String,
    pub relative_path: String,
    pub is_directory: bool,
    pub children: Option<Vec<ExplorerNode>>,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExplorerFolder {
    pub name: String,
    pub path: String,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenFolderResult {
    pub folder: ExplorerFolder,
    pub tree: Vec<ExplorerNode>,
}

/// Recursively builds a file/folder tree starting at `dir`.
/// Directories are listed before files; both sorted alphabetically.
/// `.git` is skipped entirely — it has no value for students and can
/// contain thousands of internal objects.
fn build_tree(dir: &std::path::Path, root: &std::path::Path) -> Vec<ExplorerNode> {
    let mut nodes = Vec::new();

    let entries = match std::fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return nodes,
    };

    let mut sorted: Vec<_> = entries.flatten().collect();
    sorted.sort_by_key(|e| e.file_name());

    let mut dirs = Vec::new();
    let mut files = Vec::new();

    for entry in sorted {
        let path = entry.path();
        let file_type = match entry.file_type() {
            Ok(ft) => ft,
            Err(_) => continue,
        };

        let name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string();

        if file_type.is_dir() {
            if IGNORED_DIRS.contains(&name.as_str()) {
                continue;
            }
            dirs.push((path, name));
        } else if file_type.is_file() {
            files.push((path, name));
        }
    }

    for (path, name) in dirs {
        let relative_path = path
            .strip_prefix(root)
            .unwrap_or(&path)
            .to_string_lossy()
            .to_string();

        let children = build_tree(&path, root);

        nodes.push(ExplorerNode {
            name,
            path: path.to_string_lossy().to_string(),
            relative_path,
            is_directory: true,
            children: Some(children),
        });
    }

    for (path, name) in files {
        let relative_path = path
            .strip_prefix(root)
            .unwrap_or(&path)
            .to_string_lossy()
            .to_string();

        nodes.push(ExplorerNode {
            name,
            path: path.to_string_lossy().to_string(),
            relative_path,
            is_directory: false,
            children: None,
        });
    }

    nodes
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

    let tree = build_tree(&folder_path, &folder_path);

    Some(OpenFolderResult {
        folder: ExplorerFolder {
            name,
            path: folder_path.to_string_lossy().to_string(),
        },
        tree,
    })
}

#[tauri::command]
pub fn list_folder_tree(folder_path: String) -> Vec<ExplorerNode> {
    let path = std::path::PathBuf::from(&folder_path);
    build_tree(&path, &path)
}

// ── Search (used internally by search_in_folder) ──────────────────────────────

#[derive(serde::Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct PasFile {
    name: String,
    path: String,
}

/// Recursively collects every `.pas` file under `dir`, skipping `.git`.
/// Used only by search_in_folder — the explorer tree uses build_tree instead.
fn collect_pas_files(dir: &std::path::Path, root: &std::path::Path) -> Vec<PasFile> {
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

        let name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string();

        if file_type.is_dir() {
            if IGNORED_DIRS.contains(&name.as_str()) {
                continue;
            }
            files.extend(collect_pas_files(&path, root));
        } else if file_type.is_file() && path.extension().and_then(|e| e.to_str()) == Some("pas") {
            files.push(PasFile {
                name,
                path: path.to_string_lossy().to_string(),
            });
        }
    }

    files
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchMatch {
    pub file_path: String,
    pub file_name: String,
    pub line_number: usize,
    pub line_text: String,
    pub column: usize,
}

#[tauri::command]
pub fn search_in_folder(
    folder_path: String,
    query: String,
    case_sensitive: bool,
) -> Vec<SearchMatch> {
    let mut results = Vec::new();

    if query.trim().is_empty() {
        return results;
    }

    let path = std::path::PathBuf::from(&folder_path);
    let files = collect_pas_files(&path, &path);

    let needle = if case_sensitive {
        query.clone()
    } else {
        query.to_lowercase()
    };

    for file in files {
        let content = match std::fs::read_to_string(&file.path) {
            Ok(c) => c,
            Err(_) => continue,
        };

        for (i, line) in content.lines().enumerate() {
            let haystack = if case_sensitive {
                line.to_string()
            } else {
                line.to_lowercase()
            };

            if let Some(column) = haystack.find(&needle) {
                results.push(SearchMatch {
                    file_path: file.path.clone(),
                    file_name: file.name.clone(),
                    line_number: i + 1,
                    line_text: line.to_string(),
                    column,
                });
            }
        }
    }

    results
}
