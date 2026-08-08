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

pub async fn open_workspace(app: &tauri::AppHandle) -> Option<OpenFolderResult> {
    use tauri_plugin_dialog::DialogExt;

    let path = app.dialog().file().blocking_pick_folder()?;
    let picked_path = std::path::PathBuf::from(path.to_string());
    // dunce::canonicalize, not std::fs::canonicalize - the std version
    // prefixes Windows paths with `\\?\`, which git (and other external
    // tools invoked with this path as a working directory) doesn't handle.
    let folder_path = dunce::canonicalize(&picked_path).ok()?;

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

pub fn open_workspace_at_path(path: &str) -> Result<OpenFolderResult, String> {
    let picked_path = std::path::PathBuf::from(path);

    if !picked_path.exists() {
        return Err(format!("Path does not exist: {path}"));
    }
    if !picked_path.is_dir() {
        return Err(format!("Path is not a directory: {path}"));
    }

    // dunce::canonicalize, not std::fs::canonicalize - see open_workspace above.
    let folder_path = dunce::canonicalize(&picked_path)
        .map_err(|e| format!("Failed to resolve path: {e}"))?;

    let name = folder_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Folder")
        .to_string();

    let tree = build_tree(&folder_path, &folder_path);

    Ok(OpenFolderResult {
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

pub fn delete_file(path: &str) -> Result<(), String> {
    std::fs::remove_file(path).map_err(|e| e.to_string())
}

/// Creates a new empty file at `target`. Fails explicitly if something
/// already exists there rather than silently overwriting it - unlike a bare
/// `std::fs::write`, which would truncate an existing file with the same name.
pub fn create_file(target: &std::path::Path) -> Result<(), String> {
    if target.exists() {
        return Err("A file or folder with this name already exists".to_string());
    }
    std::fs::write(target, "").map_err(|e| e.to_string())
}

/// Creates a new empty directory at `target`. `std::fs::create_dir` already
/// fails on its own if the directory exists, but the explicit check keeps
/// the error message identical to `create_file`'s, which the frontend relies
/// on to detect a name conflict.
pub fn create_directory(target: &std::path::Path) -> Result<(), String> {
    if target.exists() {
        return Err("A file or folder with this name already exists".to_string());
    }
    std::fs::create_dir(target).map_err(|e| e.to_string())
}

/// Renames an existing file or directory to `target`. Fails explicitly if
/// something already exists at `target`, matching create_file/
/// create_directory's conflict behavior - std::fs::rename would otherwise
/// silently replace an existing destination on some platforms.
pub fn rename_path(source: &std::path::Path, target: &std::path::Path) -> Result<(), String> {
    if target.exists() {
        return Err("A file or folder with this name already exists".to_string());
    }
    std::fs::rename(source, target).map_err(|e| e.to_string())
}
