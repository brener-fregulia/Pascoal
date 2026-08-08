use tauri::{AppHandle, Manager};

use crate::project::files::{self, ExplorerNode, OpenFolderResult};
use crate::project::search::{self, SearchMatch};
use crate::project::workspace_guard;
use crate::state::WorkspaceState;

pub async fn open_workspace(app: AppHandle) -> Option<OpenFolderResult> {
    let result = files::open_workspace(&app).await?;

    let state = app.state::<WorkspaceState>();
    *state.root.lock().unwrap() = Some(std::path::PathBuf::from(&result.folder.path));

    Some(result)
}

pub fn open_workspace_at_path(app: AppHandle, path: String) -> Result<OpenFolderResult, String> {
    let result = files::open_workspace_at_path(&path)?;

    let state = app.state::<WorkspaceState>();
    *state.root.lock().unwrap() = Some(std::path::PathBuf::from(&result.folder.path));

    Ok(result)
}

pub fn list_folder_tree(folder_path: String) -> Vec<ExplorerNode> {
    files::list_folder_tree(&folder_path)
}

pub fn search_in_folder(
    folder_path: String,
    query: String,
    case_sensitive: bool,
) -> Vec<SearchMatch> {
    search::search_in_folder(&folder_path, &query, case_sensitive)
}

/// Resolves the currently open workspace root, or an error if none is open.
fn current_root(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    app.state::<WorkspaceState>()
        .root
        .lock()
        .unwrap()
        .clone()
        .ok_or_else(|| "No workspace is open".to_string())
}

pub fn create_file(app: AppHandle, parent_path: String, name: String) -> Result<String, String> {
    let root = current_root(&app)?;
    let target = workspace_guard::authorize_new(&root, std::path::Path::new(&parent_path), &name)?;
    files::create_file(&target)?;
    Ok(target.to_string_lossy().to_string())
}

pub fn create_directory(
    app: AppHandle,
    parent_path: String,
    name: String,
) -> Result<String, String> {
    let root = current_root(&app)?;
    let target = workspace_guard::authorize_new(&root, std::path::Path::new(&parent_path), &name)?;
    files::create_directory(&target)?;
    Ok(target.to_string_lossy().to_string())
}

pub fn rename_path(app: AppHandle, path: String, new_name: String) -> Result<String, String> {
    let root = current_root(&app)?;
    let source = workspace_guard::authorize_existing(&root, std::path::Path::new(&path))?;
    let parent = source
        .parent()
        .ok_or_else(|| "Path has no parent directory".to_string())?;
    let target = workspace_guard::authorize_new(&root, parent, &new_name)?;
    files::rename_path(&source, &target)?;
    Ok(target.to_string_lossy().to_string())
}

pub fn trash_path(app: AppHandle, path: String) -> Result<(), String> {
    let root = current_root(&app)?;
    let target = workspace_guard::authorize_existing(&root, std::path::Path::new(&path))?;
    files::trash_path(&target)
}

pub fn delete_path_permanently(app: AppHandle, path: String) -> Result<(), String> {
    let root = current_root(&app)?;
    let target = workspace_guard::authorize_existing(&root, std::path::Path::new(&path))?;
    files::delete_path_permanently(&target)
}

pub fn copy_path(
    app: AppHandle,
    path: String,
    destination_parent: String,
) -> Result<String, String> {
    let root = current_root(&app)?;
    let source = workspace_guard::authorize_existing(&root, std::path::Path::new(&path))?;
    let dest_parent =
        workspace_guard::authorize_existing(&root, std::path::Path::new(&destination_parent))?;

    // Never copy a folder into itself or one of its own subfolders - doing
    // so would make copy_recursive recurse into the freshly-copied output,
    // never terminating and filling up the disk. Reject before attempting.
    if dest_parent == source || dest_parent.starts_with(&source) {
        return Err("Cannot copy a folder into itself or one of its own subfolders".to_string());
    }

    let name = source
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| "Path has no file name".to_string())?;
    let unique_name = files::unique_name_in(&dest_parent, name);
    let target = workspace_guard::authorize_new(&root, &dest_parent, &unique_name)?;
    files::copy_path(&source, &target)?;
    Ok(target.to_string_lossy().to_string())
}

pub fn move_path(
    app: AppHandle,
    path: String,
    destination_parent: String,
) -> Result<String, String> {
    let root = current_root(&app)?;
    let source = workspace_guard::authorize_existing(&root, std::path::Path::new(&path))?;
    let dest_parent =
        workspace_guard::authorize_existing(&root, std::path::Path::new(&destination_parent))?;

    // Same guard as copy_path - moving a folder into itself would corrupt
    // the tree, and std::fs::rename's behavior in that case isn't reliable
    // across platforms, so it's rejected explicitly rather than relied upon.
    if dest_parent == source || dest_parent.starts_with(&source) {
        return Err("Cannot move a folder into itself or one of its own subfolders".to_string());
    }

    // Pasting (moving) back into the same parent it's already in is a
    // no-op, not a conflict with itself - without this check,
    // unique_name_in would see the item's own current entry as a
    // "conflict" and rename it to a spurious "(2)".
    if source.parent() == Some(dest_parent.as_path()) {
        return Ok(source.to_string_lossy().to_string());
    }

    let name = source
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| "Path has no file name".to_string())?;
    let unique_name = files::unique_name_in(&dest_parent, name);
    let target = workspace_guard::authorize_new(&root, &dest_parent, &unique_name)?;
    files::rename_path(&source, &target)?;
    Ok(target.to_string_lossy().to_string())
}
