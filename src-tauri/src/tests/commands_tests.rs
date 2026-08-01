use crate::commands::git_commands::{git_commit, git_init, git_stage, git_status};
use crate::commands::installer_commands::detect_installer;
use crate::commands::language_commands::highlight_pascal;
use crate::commands::project_commands::{
    file_exists, list_folder_tree, read_file, save_file, search_in_folder,
};
use std::fs;

fn tmp_dir(name: &str) -> std::path::PathBuf {
    let dir = std::env::temp_dir().join(format!("pascoal_commands_test_{}", name));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    dir
}

#[test]
fn highlight_pascal_command_delegates_correctly() {
    let result = highlight_pascal("var\n  X: Integer;\nbegin\nend.".to_string());
    assert!(result.is_ok());
    assert!(!result.unwrap().is_empty());
}

#[tokio::test]
async fn save_file_and_read_file_commands_round_trip() {
    let path = tmp_dir("save_read").join("main.pas");
    let content = "program Test;".to_string();

    let save_result = save_file(content.clone(), path.to_string_lossy().to_string()).await;
    assert!(save_result.is_ok());

    let read_result = read_file(path.to_string_lossy().to_string());
    assert_eq!(read_result.unwrap(), content);
}

#[test]
fn file_exists_command_reflects_real_state() {
    let dir = tmp_dir("exists");
    let path = dir.join("main.pas");
    fs::write(&path, "x").unwrap();

    assert!(file_exists(path.to_string_lossy().to_string()));
    assert!(!file_exists(
        dir.join("missing.pas").to_string_lossy().to_string()
    ));
}

#[test]
fn list_folder_tree_command_reflects_real_files() {
    let dir = tmp_dir("list");
    fs::write(dir.join("main.pas"), "").unwrap();

    let nodes = list_folder_tree(dir.to_string_lossy().to_string());

    assert_eq!(nodes.len(), 1);
}

#[test]
fn search_in_folder_command_finds_matches() {
    let dir = tmp_dir("search");
    fs::write(dir.join("main.pas"), "writeln('hi');").unwrap();

    let results = search_in_folder(
        dir.to_string_lossy().to_string(),
        "writeln".to_string(),
        false,
    );

    assert_eq!(results.len(), 1);
}

#[test]
fn git_status_command_reports_not_a_repo_for_plain_folder() {
    let dir = tmp_dir("git_status");
    let result = git_status(dir.to_string_lossy().to_string());
    assert!(!result.is_repo);
}

#[test]
fn git_init_and_status_command_round_trip() {
    let dir = tmp_dir("git_init");
    let init_result = git_init(dir.to_string_lossy().to_string());
    assert!(init_result.is_ok());

    let status = git_status(dir.to_string_lossy().to_string());
    assert!(status.is_repo);
}

#[test]
fn git_stage_command_moves_file_to_staged() {
    let dir = tmp_dir("git_stage");
    git_init(dir.to_string_lossy().to_string()).unwrap();
    fs::write(dir.join("main.pas"), "x").unwrap();

    let result = git_stage(dir.to_string_lossy().to_string(), "main.pas".to_string());
    assert!(result.is_ok());

    let status = git_status(dir.to_string_lossy().to_string());
    assert_eq!(status.staged.len(), 1);
}

#[test]
fn git_commit_command_fails_with_empty_message() {
    let dir = tmp_dir("git_commit_empty");
    git_init(dir.to_string_lossy().to_string()).unwrap();

    let result = git_commit(dir.to_string_lossy().to_string(), "".to_string());
    assert!(result.is_err());
}

#[test]
fn detect_installer_command_does_not_panic() {
    let result = std::panic::catch_unwind(detect_installer);
    assert!(result.is_ok());
}
