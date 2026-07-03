use crate::git::{git_commit, git_init, git_stage, git_status, git_unstage};
use std::fs;
use std::process::Command;

fn tmp_repo(name: &str) -> std::path::PathBuf {
    let dir = std::env::temp_dir().join(format!("pascoal_git_test_{}", name));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    dir
}

fn configure_identity(dir: &std::path::Path) {
    let _ = Command::new("git")
        .args(["config", "user.email", "test@pascoal.dev"])
        .current_dir(dir)
        .output();
    let _ = Command::new("git")
        .args(["config", "user.name", "Pascoal Test"])
        .current_dir(dir)
        .output();
}

#[test]
fn status_reports_not_a_repo_for_plain_folder() {
    let dir = tmp_repo("not_a_repo");
    let result = git_status(dir.to_string_lossy().to_string());
    assert!(!result.is_repo);
}

#[test]
fn init_creates_a_repo() {
    let dir = tmp_repo("init");
    let result = git_init(dir.to_string_lossy().to_string());
    assert!(result.is_ok(), "git_init failed: {:?}", result);

    let status = git_status(dir.to_string_lossy().to_string());
    assert!(status.is_repo);
}

#[test]
fn status_shows_untracked_file() {
    let dir = tmp_repo("untracked");
    git_init(dir.to_string_lossy().to_string()).unwrap();
    fs::write(dir.join("main.pas"), "program Main;").unwrap();

    let status = git_status(dir.to_string_lossy().to_string());

    assert_eq!(status.unstaged.len(), 1);
    assert_eq!(status.unstaged[0].status, "untracked");
}

#[test]
fn stage_moves_file_to_staged() {
    let dir = tmp_repo("stage");
    git_init(dir.to_string_lossy().to_string()).unwrap();
    fs::write(dir.join("main.pas"), "program Main;").unwrap();

    git_stage(dir.to_string_lossy().to_string(), "main.pas".to_string()).unwrap();

    let status = git_status(dir.to_string_lossy().to_string());
    assert_eq!(status.staged.len(), 1);
    assert_eq!(status.staged[0].status, "added");
}

#[test]
fn unstage_moves_file_back() {
    let dir = tmp_repo("unstage");
    git_init(dir.to_string_lossy().to_string()).unwrap();
    fs::write(dir.join("main.pas"), "program Main;").unwrap();
    git_stage(dir.to_string_lossy().to_string(), "main.pas".to_string()).unwrap();

    git_unstage(dir.to_string_lossy().to_string(), "main.pas".to_string()).unwrap();

    let status = git_status(dir.to_string_lossy().to_string());
    assert_eq!(status.staged.len(), 0);
    assert_eq!(status.unstaged.len(), 1);
}

#[test]
fn commit_fails_with_empty_message() {
    let dir = tmp_repo("empty_commit");
    git_init(dir.to_string_lossy().to_string()).unwrap();

    let result = git_commit(dir.to_string_lossy().to_string(), "".to_string());
    assert!(result.is_err());
}

#[test]
fn commit_succeeds_with_staged_file() {
    let dir = tmp_repo("commit_success");
    git_init(dir.to_string_lossy().to_string()).unwrap();
    configure_identity(&dir);
    fs::write(dir.join("main.pas"), "program Main;").unwrap();
    git_stage(dir.to_string_lossy().to_string(), "main.pas".to_string()).unwrap();

    let result = git_commit(
        dir.to_string_lossy().to_string(),
        "Initial commit".to_string(),
    );
    assert!(result.is_ok(), "commit failed: {:?}", result);

    let status = git_status(dir.to_string_lossy().to_string());
    assert_eq!(status.staged.len(), 0);
    assert_eq!(status.unstaged.len(), 0);
}
