use crate::infrastructure::environment::get_documents_dir;
use crate::infrastructure::filesystem::{check_file_exists, write_file};
use crate::project::IGNORED_DIRS;

#[derive(serde::Serialize)]
pub struct SaveResult {
    pub path: String,
}

pub async fn open_file(app: &tauri::AppHandle) -> Option<(String, String)> {
    use tauri_plugin_dialog::DialogExt;

    let default_dir = get_documents_dir(app);

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

pub fn save_file(content: &str, file_path: &str) -> Result<SaveResult, String> {
    write_file(file_path, content)?;
    Ok(SaveResult {
        path: file_path.to_string(),
    })
}

pub async fn save_file_as(
    app: &tauri::AppHandle,
    content: &str,
    suggested_name: &str,
    folder_path: Option<String>,
) -> Option<SaveResult> {
    use tauri_plugin_dialog::DialogExt;

    let default_dir = match folder_path {
        Some(p) => std::path::PathBuf::from(p),
        None => get_documents_dir(app),
    };

    let path = app
        .dialog()
        .file()
        .set_directory(default_dir)
        .set_file_name(suggested_name)
        .add_filter("Pascal", &["pas"])
        .blocking_save_file()?;

    let path_str = path.to_string();
    write_file(&path_str, content).ok()?;

    Some(SaveResult { path: path_str })
}

pub fn file_exists(path: &str) -> bool {
    check_file_exists(path)
}

pub fn read_file(path: &str) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}

// ── Explorer ──────────────────────────────────────────────────────────────────

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
/// `.git` is skipped entirely - it has no value for students and can
/// contain thousands of internal objects.
pub fn build_tree(dir: &std::path::Path, root: &std::path::Path) -> Vec<ExplorerNode> {
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

pub async fn open_folder(app: &tauri::AppHandle) -> Option<OpenFolderResult> {
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

pub fn list_folder_tree(folder_path: &str) -> Vec<ExplorerNode> {
    let path = std::path::PathBuf::from(folder_path);
    build_tree(&path, &path)
}
