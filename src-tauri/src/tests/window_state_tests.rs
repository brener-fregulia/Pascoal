use crate::infrastructure::window_state::has_saved_window;
use std::fs;

fn temp_state_file(name: &str, content: Option<&str>) -> std::path::PathBuf {
    let path = std::env::temp_dir().join(format!("pascoal_test_window_state_{name}.json"));
    let _ = fs::remove_file(&path);
    if let Some(content) = content {
        fs::write(&path, content).unwrap();
    }
    path
}

#[test]
fn no_saved_window_when_file_is_missing() {
    let path = temp_state_file("missing", None);
    assert!(!has_saved_window(&path, "main"));
}

#[test]
fn no_saved_window_when_file_is_empty_object() {
    let path = temp_state_file("empty", Some("{}"));
    assert!(!has_saved_window(&path, "main"));
    fs::remove_file(&path).unwrap();
}

#[test]
fn no_saved_window_when_file_is_malformed() {
    let path = temp_state_file("malformed", Some("not json"));
    assert!(!has_saved_window(&path, "main"));
    fs::remove_file(&path).unwrap();
}

#[test]
fn saved_window_when_label_has_an_entry() {
    let path = temp_state_file(
        "saved",
        Some(r#"{"main":{"width":1200,"height":800,"x":10,"y":20,"maximized":false}}"#),
    );
    assert!(has_saved_window(&path, "main"));
    fs::remove_file(&path).unwrap();
}

#[test]
fn no_saved_window_for_a_different_label() {
    let path = temp_state_file("other", Some(r#"{"other":{"width":1}}"#));
    assert!(!has_saved_window(&path, "main"));
    fs::remove_file(&path).unwrap();
}
