use crate::fs::list_folder_tree;
use std::fs;

fn tmp_dir(name: &str) -> std::path::PathBuf {
    let dir = std::env::temp_dir().join(format!("pascoal_explorer_test_{}", name));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    dir
}

#[test]
fn tree_includes_all_file_types() {
    let dir = tmp_dir("all_files");
    fs::write(dir.join("main.pas"), "").unwrap();
    fs::write(dir.join(".gitignore"), "").unwrap();
    fs::write(dir.join(".env"), "").unwrap();
    fs::write(dir.join("readme.txt"), "").unwrap();

    let nodes = list_folder_tree(dir.to_string_lossy().to_string());

    let names: Vec<&str> = nodes.iter().map(|n| n.name.as_str()).collect();
    assert!(names.contains(&"main.pas"));
    assert!(names.contains(&".gitignore"));
    assert!(names.contains(&".env"));
    assert!(names.contains(&"readme.txt"));
}

#[test]
fn tree_lists_directories_before_files() {
    let dir = tmp_dir("dirs_first");
    fs::write(dir.join("zzz.pas"), "").unwrap();
    fs::create_dir(dir.join("aaa_folder")).unwrap();

    let nodes = list_folder_tree(dir.to_string_lossy().to_string());

    assert!(nodes[0].is_directory);
    assert_eq!(nodes[0].name, "aaa_folder");
    assert!(!nodes[1].is_directory);
}

#[test]
fn tree_recurses_into_subfolders() {
    let dir = tmp_dir("recurse");
    let sub = dir.join("src");
    fs::create_dir(&sub).unwrap();
    fs::write(sub.join("main.pas"), "").unwrap();

    let nodes = list_folder_tree(dir.to_string_lossy().to_string());

    assert_eq!(nodes.len(), 1);
    assert!(nodes[0].is_directory);
    let children = nodes[0].children.as_ref().unwrap();
    assert_eq!(children.len(), 1);
    assert_eq!(children[0].name, "main.pas");
}

#[test]
fn tree_excludes_git_directory() {
    let dir = tmp_dir("exclude_git");
    fs::create_dir(dir.join(".git")).unwrap();
    fs::write(dir.join(".git").join("HEAD"), "").unwrap();
    fs::write(dir.join("main.pas"), "").unwrap();

    let nodes = list_folder_tree(dir.to_string_lossy().to_string());

    let names: Vec<&str> = nodes.iter().map(|n| n.name.as_str()).collect();
    assert!(!names.contains(&".git"));
    assert!(names.contains(&"main.pas"));
}

#[test]
fn tree_relative_path_is_correct_for_nested_file() {
    let dir = tmp_dir("relative_nested");
    let sub = dir.join("src");
    fs::create_dir(&sub).unwrap();
    fs::write(sub.join("main.pas"), "").unwrap();

    let nodes = list_folder_tree(dir.to_string_lossy().to_string());
    let children = nodes[0].children.as_ref().unwrap();

    let expected = std::path::Path::new("src").join("main.pas");
    assert_eq!(children[0].relative_path, expected.to_string_lossy());
}

#[test]
fn tree_returns_empty_for_empty_folder() {
    let dir = tmp_dir("empty");
    let nodes = list_folder_tree(dir.to_string_lossy().to_string());
    assert_eq!(nodes.len(), 0);
}

#[test]
fn tree_returns_empty_for_invalid_path() {
    let nodes = list_folder_tree("/nonexistent/path/xyz".to_string());
    assert_eq!(nodes.len(), 0);
}

#[test]
fn empty_subfolder_has_empty_children_not_none() {
    let dir = tmp_dir("empty_subfolder");
    fs::create_dir(dir.join("empty_dir")).unwrap();

    let nodes = list_folder_tree(dir.to_string_lossy().to_string());

    assert!(nodes[0].is_directory);
    assert_eq!(nodes[0].children.as_ref().unwrap().len(), 0);
}
