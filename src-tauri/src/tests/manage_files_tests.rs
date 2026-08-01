use crate::application::manage_files::{file_exists, read_file, save_file};
use std::fs;

fn tmp_path(name: &str) -> std::path::PathBuf {
    std::env::temp_dir().join(format!("pascoal_manage_files_test_{}", name))
}

#[test]
fn save_file_writes_content() {
    let path = tmp_path("save.pas");
    let content = "program Test;\nbegin\nend.".to_string();

    let result = save_file(content.clone(), path.to_string_lossy().to_string());

    assert!(result.is_ok());
    assert_eq!(result.unwrap().path, path.to_string_lossy());
    assert_eq!(fs::read_to_string(&path).unwrap(), content);
    let _ = fs::remove_file(&path);
}

#[test]
fn save_file_fails_for_invalid_path() {
    let result = save_file(
        "content".to_string(),
        "/nonexistent/deep/path/file.pas".to_string(),
    );
    assert!(result.is_err());
}

#[test]
fn file_exists_reflects_real_state() {
    let path = tmp_path("exists.pas");
    fs::write(&path, "x").unwrap();

    assert!(file_exists(path.to_string_lossy().to_string()));
    assert!(!file_exists("/nonexistent/path/xyz.pas".to_string()));

    let _ = fs::remove_file(&path);
}

#[test]
fn read_file_returns_content() {
    let path = tmp_path("read.pas");
    fs::write(&path, "program Test;").unwrap();

    let result = read_file(path.to_string_lossy().to_string());

    assert_eq!(result.unwrap(), "program Test;");
    let _ = fs::remove_file(&path);
}

#[test]
fn read_file_fails_for_missing_file() {
    let result = read_file("/nonexistent/path/xyz.pas".to_string());
    assert!(result.is_err());
}
