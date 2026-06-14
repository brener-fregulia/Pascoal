use crate::{check_file_exists, write_file};
use std::fs;

#[test]
fn file_exists_returns_true_for_existing_file() {
    let tmp = std::env::temp_dir().join("pascoal_test_exists.pas");
    fs::write(&tmp, "program Test;").unwrap();
    assert!(check_file_exists(&tmp.to_string_lossy()));
    fs::remove_file(tmp).unwrap();
}

#[test]
fn file_exists_returns_false_for_missing_file() {
    assert!(!check_file_exists(
        "/nonexistent/path/that/does/not/exist/file.pas"
    ));
}

#[test]
fn write_file_writes_content() {
    let tmp = std::env::temp_dir().join("pascoal_test_save.pas");
    let content = "program HelloWorld;\nbegin\n  writeln('Hello');\nend.";
    let path = tmp.to_string_lossy().to_string();

    let result = write_file(&path, content);

    assert!(result.is_ok());
    assert_eq!(fs::read_to_string(&tmp).unwrap(), content);
    fs::remove_file(tmp).unwrap();
}

#[test]
fn write_file_fails_for_invalid_path() {
    let result = write_file("/nonexistent/deep/path/file.pas", "content");
    assert!(result.is_err());
}
