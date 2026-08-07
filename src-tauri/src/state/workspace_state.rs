pub struct WorkspaceState {
    pub root: std::sync::Mutex<Option<std::path::PathBuf>>,
}

impl WorkspaceState {
    pub fn new() -> Self {
        Self {
            root: std::sync::Mutex::new(None),
        }
    }
}
