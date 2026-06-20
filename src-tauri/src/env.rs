use tauri::Manager;

pub fn detect_fpc() -> (bool, Option<String>) {
    let output = std::process::Command::new("fpc").arg("-iV").output();

    match output {
        Ok(o) if o.status.success() => {
            let version = String::from_utf8(o.stdout)
                .ok()
                .map(|s| s.trim().to_string());
            (true, version)
        }
        _ => (false, None),
    }
}

pub fn get_documents_dir(app: &tauri::AppHandle) -> std::path::PathBuf {
    let docs = app
        .path()
        .document_dir()
        .unwrap_or_else(|_| std::path::PathBuf::from("."));
    let pascoal_dir = docs.join("Pascoal");
    if !pascoal_dir.exists() {
        let _ = std::fs::create_dir_all(&pascoal_dir);
    }
    pascoal_dir
}
