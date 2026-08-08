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
