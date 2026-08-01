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

use crate::commands::git_commands::{
    git_check_identity, git_diff, git_set_identity, git_stage_all, git_unstage, git_unstage_all,
};

#[test]
fn git_diff_command_returns_diff_for_staged_file() {
    let dir = tmp_dir("git_diff");
    git_init(dir.to_string_lossy().to_string()).unwrap();
    fs::write(dir.join("main.pas"), "program Test;").unwrap();
    git_stage(dir.to_string_lossy().to_string(), "main.pas".to_string()).unwrap();

    let result = git_diff(
        dir.to_string_lossy().to_string(),
        "main.pas".to_string(),
        true,
    );

    assert!(result.is_ok());
}

#[test]
fn git_unstage_command_moves_file_back() {
    let dir = tmp_dir("git_unstage");
    git_init(dir.to_string_lossy().to_string()).unwrap();
    fs::write(dir.join("main.pas"), "x").unwrap();
    git_stage(dir.to_string_lossy().to_string(), "main.pas".to_string()).unwrap();

    let result = git_unstage(dir.to_string_lossy().to_string(), "main.pas".to_string());
    assert!(result.is_ok());

    let status = git_status(dir.to_string_lossy().to_string());
    assert_eq!(status.staged.len(), 0);
}

#[test]
fn git_stage_all_and_unstage_all_commands() {
    let dir = tmp_dir("git_stage_all");
    git_init(dir.to_string_lossy().to_string()).unwrap();
    fs::write(dir.join("a.pas"), "x").unwrap();
    fs::write(dir.join("b.pas"), "x").unwrap();

    let stage_result = git_stage_all(dir.to_string_lossy().to_string());
    assert!(stage_result.is_ok());
    assert_eq!(
        git_status(dir.to_string_lossy().to_string()).staged.len(),
        2
    );

    let unstage_result = git_unstage_all(dir.to_string_lossy().to_string());
    assert!(unstage_result.is_ok());
    assert_eq!(
        git_status(dir.to_string_lossy().to_string()).staged.len(),
        0
    );
}

#[test]
fn git_set_identity_and_check_identity_commands_round_trip() {
    let dir = tmp_dir("git_identity");
    git_init(dir.to_string_lossy().to_string()).unwrap();

    let set_result = git_set_identity(
        dir.to_string_lossy().to_string(),
        "Test User".to_string(),
        "test@example.com".to_string(),
        false,
    );
    assert!(set_result.is_ok());

    let identity = git_check_identity(dir.to_string_lossy().to_string());
    assert_eq!(identity.name.as_deref(), Some("Test User"));
    assert_eq!(identity.email.as_deref(), Some("test@example.com"));
}
