use crate::project::files::{create_directory, create_file, list_folder_tree, open_workspace_at_path};
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

    let nodes = list_folder_tree(&dir.to_string_lossy());

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

    let nodes = list_folder_tree(&dir.to_string_lossy());

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

    let nodes = list_folder_tree(&dir.to_string_lossy());

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

    let nodes = list_folder_tree(&dir.to_string_lossy());

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

    let nodes = list_folder_tree(&dir.to_string_lossy());
    let children = nodes[0].children.as_ref().unwrap();

    let expected = std::path::Path::new("src").join("main.pas");
    assert_eq!(children[0].relative_path, expected.to_string_lossy());
}

#[test]
fn tree_returns_empty_for_empty_folder() {
    let dir = tmp_dir("empty");
    let nodes = list_folder_tree(&dir.to_string_lossy());
    assert_eq!(nodes.len(), 0);
}

#[test]
fn tree_returns_empty_for_invalid_path() {
    let nodes = list_folder_tree("/nonexistent/path/xyz");
    assert_eq!(nodes.len(), 0);
}

#[test]
fn empty_subfolder_has_empty_children_not_none() {
    let dir = tmp_dir("empty_subfolder");
    fs::create_dir(dir.join("empty_dir")).unwrap();

    let nodes = list_folder_tree(&dir.to_string_lossy());

    assert!(nodes[0].is_directory);
    assert_eq!(nodes[0].children.as_ref().unwrap().len(), 0);
}

#[test]
fn open_workspace_at_path_returns_folder_and_tree_for_valid_directory() {
    let dir = tmp_dir("open_valid");
    fs::write(dir.join("main.pas"), "").unwrap();

    let result = open_workspace_at_path(&dir.to_string_lossy()).unwrap();

    let expected_name = dir.file_name().unwrap().to_string_lossy().to_string();
    assert_eq!(result.folder.name, expected_name);

    let canonical = dunce::canonicalize(&dir).unwrap();
    assert_eq!(result.folder.path, canonical.to_string_lossy());

    assert_eq!(result.tree.len(), 1);
    assert_eq!(result.tree[0].name, "main.pas");
}

#[test]
fn open_workspace_at_path_fails_for_nonexistent_path() {
    let result = open_workspace_at_path("/nonexistent/path/xyz_open_workspace");

    assert!(result.is_err());
}

#[test]
fn open_workspace_at_path_fails_when_path_is_a_file() {
    let dir = tmp_dir("open_file_not_dir");
    let file_path = dir.join("main.pas");
    fs::write(&file_path, "").unwrap();

    let result = open_workspace_at_path(&file_path.to_string_lossy());

    assert!(result.is_err());
}

#[test]
fn create_file_writes_an_empty_file_to_disk() {
    let dir = tmp_dir("create_file_success");
    let target = dir.join("new.pas");

    let result = create_file(&target);

    assert!(result.is_ok());
    assert!(target.is_file());
    assert_eq!(fs::read_to_string(&target).unwrap(), "");
}

#[test]
fn create_directory_creates_a_new_folder() {
    let dir = tmp_dir("create_directory_success");
    let target = dir.join("new_folder");

    let result = create_directory(&target);

    assert!(result.is_ok());
    assert!(target.is_dir());
}

#[test]
fn create_file_fails_with_conflict_message_when_a_file_already_exists() {
    let dir = tmp_dir("create_file_conflict_file");
    let target = dir.join("existing.pas");
    fs::write(&target, "original content").unwrap();

    let result = create_file(&target);

    assert_eq!(
        result,
        Err("A file or folder with this name already exists".to_string())
    );
    // The existing file must not have been truncated.
    assert_eq!(fs::read_to_string(&target).unwrap(), "original content");
}

#[test]
fn create_directory_fails_with_conflict_message_when_a_directory_already_exists() {
    let dir = tmp_dir("create_directory_conflict_dir");
    let target = dir.join("existing_folder");
    fs::create_dir(&target).unwrap();

    let result = create_directory(&target);

    assert_eq!(
        result,
        Err("A file or folder with this name already exists".to_string())
    );
}

#[test]
fn create_file_fails_with_conflict_message_when_a_directory_with_the_same_name_exists() {
    let dir = tmp_dir("create_file_conflict_dir");
    let target = dir.join("same_name");
    fs::create_dir(&target).unwrap();

    let result = create_file(&target);

    assert_eq!(
        result,
        Err("A file or folder with this name already exists".to_string())
    );
    assert!(target.is_dir());
}

#[test]
fn create_directory_fails_with_conflict_message_when_a_file_with_the_same_name_exists() {
    let dir = tmp_dir("create_directory_conflict_file");
    let target = dir.join("same_name");
    fs::write(&target, "content").unwrap();

    let result = create_directory(&target);

    assert_eq!(
        result,
        Err("A file or folder with this name already exists".to_string())
    );
    assert!(target.is_file());
}
