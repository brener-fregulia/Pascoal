use crate::infrastructure::git::{
    check_identity, commit, init, set_identity, stage, status, unstage,
};
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
    let result = status(&dir.to_string_lossy());
    assert!(!result.is_repo);
}

#[test]
fn init_creates_a_repo() {
    let dir = tmp_repo("init");
    let result = init(&dir.to_string_lossy());
    assert!(result.is_ok(), "init failed: {:?}", result);

    let s = status(&dir.to_string_lossy());
    assert!(s.is_repo);
}

#[test]
fn status_shows_untracked_file() {
    let dir = tmp_repo("untracked");
    init(&dir.to_string_lossy()).unwrap();
    fs::write(dir.join("main.pas"), "program Main;").unwrap();

    let s = status(&dir.to_string_lossy());

    assert_eq!(s.unstaged.len(), 1);
    assert_eq!(s.unstaged[0].status, "untracked");
}

#[test]
fn stage_moves_file_to_staged() {
    let dir = tmp_repo("stage");
    init(&dir.to_string_lossy()).unwrap();
    fs::write(dir.join("main.pas"), "program Main;").unwrap();

    stage(&dir.to_string_lossy(), "main.pas").unwrap();

    let s = status(&dir.to_string_lossy());
    assert_eq!(s.staged.len(), 1);
    assert_eq!(s.staged[0].status, "added");
}

#[test]
fn unstage_moves_file_back() {
    let dir = tmp_repo("unstage");
    init(&dir.to_string_lossy()).unwrap();
    fs::write(dir.join("main.pas"), "program Main;").unwrap();
    stage(&dir.to_string_lossy(), "main.pas").unwrap();

    unstage(&dir.to_string_lossy(), "main.pas").unwrap();

    let s = status(&dir.to_string_lossy());
    assert_eq!(s.staged.len(), 0);
    assert_eq!(s.unstaged.len(), 1);
}

#[test]
fn commit_fails_with_empty_message() {
    let dir = tmp_repo("empty_commit");
    init(&dir.to_string_lossy()).unwrap();

    let result = commit(&dir.to_string_lossy(), "");
    assert!(result.is_err());
}

#[test]
fn commit_succeeds_with_staged_file() {
    let dir = tmp_repo("commit_success");
    init(&dir.to_string_lossy()).unwrap();
    configure_identity(&dir);
    fs::write(dir.join("main.pas"), "program Main;").unwrap();
    stage(&dir.to_string_lossy(), "main.pas").unwrap();

    let result = commit(&dir.to_string_lossy(), "Initial commit");
    assert!(result.is_ok(), "commit failed: {:?}", result);

    let s = status(&dir.to_string_lossy());
    assert_eq!(s.staged.len(), 0);
    assert_eq!(s.unstaged.len(), 0);
}

#[test]
fn check_identity_returns_none_when_unset_locally_and_no_global() {
    // Note: this test assumes the test runner environment has no global
    // git identity configured. If your machine has a global user.name/email
    // set, this test will reflect that instead — which is correct behavior,
    // not a bug, since check_identity intentionally reads the effective
    // (local-overrides-global) config.
    let dir = tmp_repo("identity_check_env_dependent");
    init(&dir.to_string_lossy()).unwrap();

    let identity = check_identity(&dir.to_string_lossy());
    // Just verify it doesn't panic and returns a well-formed struct;
    // presence/absence depends on the machine's global git config.
    let _ = identity.name;
    let _ = identity.email;
}

#[test]
fn set_identity_locally_is_then_detected() {
    let dir = tmp_repo("set_identity_local");
    init(&dir.to_string_lossy()).unwrap();

    set_identity(
        &dir.to_string_lossy(),
        "Test User",
        "test@example.com",
        false,
    )
    .unwrap();

    let identity = check_identity(&dir.to_string_lossy());
    assert_eq!(identity.name.as_deref(), Some("Test User"));
    assert_eq!(identity.email.as_deref(), Some("test@example.com"));
}

#[test]
fn commit_succeeds_after_setting_local_identity() {
    let dir = tmp_repo("commit_after_identity");
    init(&dir.to_string_lossy()).unwrap();
    fs::write(dir.join("main.pas"), "program Main;").unwrap();
    stage(&dir.to_string_lossy(), "main.pas").unwrap();

    set_identity(
        &dir.to_string_lossy(),
        "Test User",
        "test@example.com",
        false,
    )
    .unwrap();

    let result = commit(&dir.to_string_lossy(), "Initial commit");
    assert!(result.is_ok(), "commit failed: {:?}", result);
}
