use crate::application::manage_workspace::{list_folder_tree, search_in_folder};
use std::fs;

fn tmp_dir(name: &str) -> std::path::PathBuf {
    let dir = std::env::temp_dir().join(format!("pascoal_manage_workspace_test_{}", name));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    dir
}

#[test]
fn list_folder_tree_reflects_real_files() {
    let dir = tmp_dir("list");
    fs::write(dir.join("main.pas"), "").unwrap();

    let nodes = list_folder_tree(dir.to_string_lossy().to_string());

    assert_eq!(nodes.len(), 1);
    assert_eq!(nodes[0].name, "main.pas");
}

#[test]
fn search_in_folder_finds_matches() {
    let dir = tmp_dir("search");
    fs::write(dir.join("main.pas"), "writeln('hi');\n").unwrap();

    let results = search_in_folder(
        dir.to_string_lossy().to_string(),
        "writeln".to_string(),
        false,
    );

    assert_eq!(results.len(), 1);
}

#[test]
fn search_in_folder_returns_empty_for_no_matches() {
    let dir = tmp_dir("search_empty");
    fs::write(dir.join("main.pas"), "begin end.").unwrap();

    let results = search_in_folder(
        dir.to_string_lossy().to_string(),
        "nonexistent".to_string(),
        false,
    );

    assert!(results.is_empty());
}
