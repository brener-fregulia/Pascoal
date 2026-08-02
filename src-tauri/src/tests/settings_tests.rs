use crate::infrastructure::settings::{read, write};
use std::fs;

#[test]
fn write_creates_file_with_content() {
    let path = std::env::temp_dir().join("pascoal_test_settings_write.json");
    let content = "{\"autoSaveBeforeRun\":false}";

    let result = write(&path, content);

    assert!(result.is_ok());
    assert_eq!(fs::read_to_string(&path).unwrap(), content);
    fs::remove_file(&path).unwrap();
}

#[test]
fn write_creates_parent_directory_if_missing() {
    let dir = std::env::temp_dir().join("pascoal_test_settings_nested_dir");
    let path = dir.join("settings.json");
    let _ = fs::remove_dir_all(&dir);

    let result = write(&path, "{}");

    assert!(result.is_ok());
    assert!(path.exists());
    fs::remove_dir_all(&dir).unwrap();
}

#[test]
fn write_fails_when_parent_is_not_a_directory() {
    let blocking_file = std::env::temp_dir().join("pascoal_test_settings_blocker");
    fs::write(&blocking_file, "not a directory").unwrap();
    let path = blocking_file.join("settings.json");

    let result = write(&path, "{}");

    assert!(result.is_err());
    fs::remove_file(&blocking_file).unwrap();
}

#[test]
fn read_returns_content() {
    let path = std::env::temp_dir().join("pascoal_test_settings_read.json");
    fs::write(&path, "{\"autoSaveBeforeRun\":true}").unwrap();

    let result = read(&path);

    assert_eq!(result.unwrap(), "{\"autoSaveBeforeRun\":true}");
    fs::remove_file(&path).unwrap();
}

#[test]
fn read_fails_for_missing_file() {
    let result = read(std::path::Path::new("/nonexistent/path/settings.json"));
    assert!(result.is_err());
}
