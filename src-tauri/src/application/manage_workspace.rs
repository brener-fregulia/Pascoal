use tauri::AppHandle;

use crate::project::files::{self, ExplorerNode, OpenFolderResult};
use crate::project::search::{self, SearchMatch};

pub async fn open_folder(app: AppHandle) -> Option<OpenFolderResult> {
    files::open_folder(&app).await
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
