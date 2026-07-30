pub fn check_file_exists(path: &str) -> bool {
    std::path::Path::new(path).exists()
}

pub fn write_file(path: &str, content: &str) -> Result<(), String> {
    std::fs::write(path, content).map_err(|e| e.to_string())
}

/// Opens a URL/path with the OS-default handler. Not filesystem-specific,
/// but has no better home yet - moves into infrastructure::platform
/// alongside winproc.rs when that module gets migrated.
pub fn open_url(url: &str) {
    #[cfg(target_os = "windows")]
    let _ = std::process::Command::new("cmd")
        .args(["/c", "start", url])
        .spawn();

    #[cfg(target_os = "macos")]
    let _ = std::process::Command::new("open").arg(url).spawn();

    #[cfg(target_os = "linux")]
    let _ = std::process::Command::new("xdg-open").arg(url).spawn();
}
