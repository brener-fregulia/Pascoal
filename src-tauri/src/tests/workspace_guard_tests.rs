use crate::project::workspace_guard::{authorize_existing, authorize_new};
use std::fs;

fn tmp_dir(name: &str) -> std::path::PathBuf {
    let dir = std::env::temp_dir().join(format!("pascoal_workspace_guard_test_{}", name));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    dir
}

#[test]
fn authorizes_a_valid_name_when_parent_is_the_workspace_root() {
    let root = tmp_dir("root_is_parent");

    let result = authorize_new(&root, &root, "new.pas").unwrap();

    let expected = dunce::canonicalize(&root).unwrap().join("new.pas");
    assert_eq!(result, expected);
}

#[test]
fn authorizes_a_valid_name_when_parent_is_a_subfolder_of_the_root() {
    let root = tmp_dir("root_with_subfolder");
    let sub = root.join("src");
    fs::create_dir(&sub).unwrap();

    let result = authorize_new(&root, &sub, "new.pas").unwrap();

    let expected = dunce::canonicalize(&sub).unwrap().join("new.pas");
    assert_eq!(result, expected);
}

#[test]
fn rejects_a_parent_outside_the_workspace_root() {
    let root = tmp_dir("root_for_outside_check");
    let sibling = tmp_dir("sibling_outside_root");

    let result = authorize_new(&root, &sibling, "new.pas");

    assert!(result.is_err());
}

#[test]
fn rejects_a_parent_that_does_not_exist() {
    let root = tmp_dir("root_for_missing_parent");
    let missing_parent = root.join("does_not_exist");

    let result = authorize_new(&root, &missing_parent, "new.pas");

    assert!(result.is_err());
}

#[test]
fn rejects_an_empty_name() {
    let root = tmp_dir("root_for_empty_name");

    let result = authorize_new(&root, &root, "");

    assert_eq!(result, Err("Name cannot be empty".to_string()));
}

#[test]
fn rejects_a_name_of_a_single_dot() {
    let root = tmp_dir("root_for_dot_name");

    let result = authorize_new(&root, &root, ".");

    assert_eq!(result, Err("Name cannot be '.' or '..'".to_string()));
}

#[test]
fn rejects_a_name_of_double_dot() {
    let root = tmp_dir("root_for_dotdot_name");

    let result = authorize_new(&root, &root, "..");

    assert_eq!(result, Err("Name cannot be '.' or '..'".to_string()));
}

#[test]
fn rejects_a_name_containing_a_forward_slash() {
    let root = tmp_dir("root_for_forward_slash_name");

    // This is how a traversal attempt such as `../escape` gets rejected -
    // by the presence of a path separator, not by recognizing ".." inside
    // the name specifically.
    let result = authorize_new(&root, &root, "../escape");

    assert_eq!(
        result,
        Err("Name cannot contain a path separator".to_string())
    );
}

#[test]
fn rejects_a_name_containing_a_backslash() {
    let root = tmp_dir("root_for_backslash_name");

    let result = authorize_new(&root, &root, "..\\escape");

    assert_eq!(
        result,
        Err("Name cannot contain a path separator".to_string())
    );
}

#[test]
fn rejects_a_name_containing_a_windows_reserved_character() {
    let root = tmp_dir("root_for_reserved_char_name");

    let result = authorize_new(&root, &root, "bad:name.pas");

    assert_eq!(
        result,
        Err("Name contains a reserved character".to_string())
    );
}

#[test]
fn rejects_a_parent_that_escapes_the_workspace_through_a_symlink() {
    let root = tmp_dir("root_for_symlink_escape");
    let outside = tmp_dir("outside_target_for_symlink_escape");
    let link = root.join("escape_link");

    #[cfg(unix)]
    let symlink_created = std::os::unix::fs::symlink(&outside, &link).is_ok();
    #[cfg(windows)]
    let symlink_created = std::os::windows::fs::symlink_dir(&outside, &link).is_ok();
    #[cfg(not(any(unix, windows)))]
    let symlink_created = false;

    if !symlink_created {
        eprintln!(
            "skipping rejects_a_parent_that_escapes_the_workspace_through_a_symlink: \
            unable to create a directory symlink in this environment \
            (missing privilege on Windows / Developer Mode not enabled, or unsupported platform)"
        );
        return;
    }

    // `link` lives inside `root` but resolves (via canonicalization) to a
    // directory outside it - authorizing a new entry with `link` as the
    // parent must still be rejected.
    let result = authorize_new(&root, &link, "new.pas");

    assert!(result.is_err());
}

#[test]
fn authorize_existing_authorizes_the_root_itself_as_the_candidate() {
    let root = tmp_dir("existing_root_is_candidate");

    let result = authorize_existing(&root, &root).unwrap();

    let expected = dunce::canonicalize(&root).unwrap();
    assert_eq!(result, expected);
}

#[test]
fn authorize_existing_authorizes_a_file_inside_the_root() {
    let root = tmp_dir("existing_file_inside_root");
    let file = root.join("main.pas");
    fs::write(&file, "").unwrap();

    let result = authorize_existing(&root, &file).unwrap();

    let expected = dunce::canonicalize(&file).unwrap();
    assert_eq!(result, expected);
}

#[test]
fn authorize_existing_authorizes_a_subfolder_inside_the_root() {
    let root = tmp_dir("existing_subfolder_inside_root");
    let sub = root.join("src");
    fs::create_dir(&sub).unwrap();

    let result = authorize_existing(&root, &sub).unwrap();

    let expected = dunce::canonicalize(&sub).unwrap();
    assert_eq!(result, expected);
}

#[test]
fn authorize_existing_rejects_a_candidate_outside_the_root() {
    let root = tmp_dir("existing_root_for_outside_check");
    let outside = tmp_dir("existing_outside_candidate");

    let result = authorize_existing(&root, &outside);

    assert!(result.is_err());
}

#[test]
fn authorize_existing_rejects_a_candidate_that_does_not_exist() {
    let root = tmp_dir("existing_root_for_missing_candidate");
    let missing = root.join("does_not_exist.pas");

    let result = authorize_existing(&root, &missing);

    assert!(result.is_err());
}

#[test]
fn authorize_existing_rejects_a_candidate_that_escapes_the_root_through_a_symlink() {
    let root = tmp_dir("existing_root_for_symlink_escape");
    let outside = tmp_dir("existing_outside_target_for_symlink_escape");
    let link = root.join("escape_link");

    #[cfg(unix)]
    let symlink_created = std::os::unix::fs::symlink(&outside, &link).is_ok();
    #[cfg(windows)]
    let symlink_created = std::os::windows::fs::symlink_dir(&outside, &link).is_ok();
    #[cfg(not(any(unix, windows)))]
    let symlink_created = false;

    if !symlink_created {
        eprintln!(
            "skipping authorize_existing_rejects_a_candidate_that_escapes_the_root_through_a_symlink: \
            unable to create a directory symlink in this environment \
            (missing privilege on Windows / Developer Mode not enabled, or unsupported platform)"
        );
        return;
    }

    // `link` lives inside `root` but resolves (via canonicalization) to a
    // directory outside it - authorizing it as an existing candidate must
    // still be rejected.
    let result = authorize_existing(&root, &link);

    assert!(result.is_err());
}
