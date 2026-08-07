pub fn check_file_exists(path: &str) -> bool {
    std::path::Path::new(path).exists()
}

pub fn write_file(path: &str, content: &str) -> Result<(), String> {
    std::fs::write(path, content).map_err(|e| e.to_string())
}

/// Opens a URL with the OS-default handler via the opener plugin. Only the
/// `https://` scheme is accepted - every current caller is a static HTTPS
/// constant, so there is no need to allowlist `mailto:` or any other scheme.
pub fn open_url(app: &tauri::AppHandle, url: &str) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;

    if !url.starts_with("https://") {
        return Err("Only https:// URLs can be opened".to_string());
    }

    app.opener()
        .open_url(url, None::<&str>)
        .map_err(|e| e.to_string())
}

/// Reveals an existing file or folder in the OS's default file manager via
/// the opener plugin. Not routed through `workspace_guard` - the target may
/// be outside any open workspace (e.g. a file picked via a dialog), and the
/// operation is read-only.
pub fn reveal_in_file_manager(app: &tauri::AppHandle, path: &str) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;

    if path.is_empty() {
        return Err("Path cannot be empty".to_string());
    }

    if !std::path::Path::new(path).exists() {
        return Err("Path does not exist".to_string());
    }

    app.opener()
        .reveal_item_in_dir(path)
        .map_err(|e| e.to_string())
}
