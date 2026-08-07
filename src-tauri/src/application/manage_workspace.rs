use tauri::{AppHandle, Manager};

use crate::project::files::{self, ExplorerNode, OpenFolderResult};
use crate::project::search::{self, SearchMatch};
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
