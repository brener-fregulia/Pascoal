use crate::project::files::{
    copy_path, create_directory, create_file, delete_path_permanently, is_self_or_descendant,
    list_folder_tree, open_workspace_at_path, rename_path, trash_path, unique_name_in,
};
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

#[test]
fn rename_path_renames_a_file_successfully() {
    let dir = tmp_dir("rename_file_success");
    let source = dir.join("old.pas");
    let target = dir.join("new.pas");
    fs::write(&source, "program Old;").unwrap();

    let result = rename_path(&source, &target);

    assert!(result.is_ok());
    assert!(!source.exists());
    assert!(target.is_file());
    assert_eq!(fs::read_to_string(&target).unwrap(), "program Old;");
}

#[test]
fn rename_path_renames_a_folder_and_its_contents_successfully() {
    let dir = tmp_dir("rename_folder_success");
    let source = dir.join("old_folder");
    let target = dir.join("new_folder");
    fs::create_dir(&source).unwrap();
    fs::write(source.join("inner.pas"), "program Inner;").unwrap();

    let result = rename_path(&source, &target);

    assert!(result.is_ok());
    assert!(!source.exists());
    assert!(target.is_dir());
    assert_eq!(
        fs::read_to_string(target.join("inner.pas")).unwrap(),
        "program Inner;"
    );
}

#[test]
fn rename_path_fails_with_conflict_message_when_the_destination_already_exists() {
    let dir = tmp_dir("rename_conflict");
    let source = dir.join("old.pas");
    let target = dir.join("existing.pas");
    fs::write(&source, "program Old;").unwrap();
    fs::write(&target, "original content").unwrap();

    let result = rename_path(&source, &target);

    assert_eq!(
        result,
        Err("A file or folder with this name already exists".to_string())
    );
    // Neither the source nor the pre-existing destination were touched.
    assert!(source.is_file());
    assert_eq!(fs::read_to_string(&target).unwrap(), "original content");
}

#[test]
fn trash_path_moves_a_file_out_of_its_original_location() {
    let dir = tmp_dir("trash_file_success");
    let target = dir.join("doomed.pas");
    fs::write(&target, "program Doomed;").unwrap();

    let result = trash_path(&target);

    assert!(result.is_ok());
    assert!(!target.exists());
}

#[test]
fn trash_path_moves_a_folder_with_contents_out_of_its_original_location() {
    let dir = tmp_dir("trash_folder_success");
    let target = dir.join("doomed_folder");
    fs::create_dir(&target).unwrap();
    fs::write(target.join("inner.pas"), "program Inner;").unwrap();

    let result = trash_path(&target);

    assert!(result.is_ok());
    assert!(!target.exists());
}

#[test]
fn trash_path_fails_for_a_nonexistent_path() {
    let dir = tmp_dir("trash_nonexistent");
    let target = dir.join("does_not_exist.pas");

    let result = trash_path(&target);

    assert!(result.is_err());
}

#[test]
fn delete_path_permanently_removes_a_file() {
    let dir = tmp_dir("delete_permanently_file_success");
    let target = dir.join("doomed.pas");
    fs::write(&target, "program Doomed;").unwrap();

    let result = delete_path_permanently(&target);

    assert!(result.is_ok());
    assert!(!target.exists());
}

#[test]
fn delete_path_permanently_removes_a_folder_and_its_contents_recursively() {
    let dir = tmp_dir("delete_permanently_folder_success");
    let target = dir.join("doomed_folder");
    fs::create_dir(&target).unwrap();
    fs::write(target.join("inner.pas"), "program Inner;").unwrap();

    let result = delete_path_permanently(&target);

    assert!(result.is_ok());
    assert!(!target.exists());
}

#[test]
fn delete_path_permanently_fails_for_a_nonexistent_path() {
    let dir = tmp_dir("delete_permanently_nonexistent");
    let target = dir.join("does_not_exist.pas");

    let result = delete_path_permanently(&target);

    assert!(result.is_err());
}

#[test]
fn unique_name_in_returns_the_name_unchanged_when_there_is_no_conflict() {
    let dir = tmp_dir("unique_name_no_conflict");

    let result = unique_name_in(&dir, "main.pas");

    assert_eq!(result, "main.pas");
}

#[test]
fn unique_name_in_appends_a_counter_before_the_extension_on_conflict() {
    let dir = tmp_dir("unique_name_conflict_with_extension");
    fs::write(dir.join("main.pas"), "").unwrap();

    let result = unique_name_in(&dir, "main.pas");

    assert_eq!(result, "main (2).pas");
}

#[test]
fn unique_name_in_appends_a_counter_with_no_extension_when_the_name_has_none() {
    let dir = tmp_dir("unique_name_conflict_no_extension");
    fs::create_dir(dir.join("folder")).unwrap();

    let result = unique_name_in(&dir, "folder");

    assert_eq!(result, "folder (2)");
}

#[test]
fn unique_name_in_increments_until_it_finds_a_free_name() {
    let dir = tmp_dir("unique_name_increments");
    fs::write(dir.join("main.pas"), "").unwrap();
    fs::write(dir.join("main (2).pas"), "").unwrap();

    let result = unique_name_in(&dir, "main.pas");

    assert_eq!(result, "main (3).pas");
}

#[test]
fn copy_path_copies_a_file_and_keeps_the_original() {
    let dir = tmp_dir("copy_file_success");
    let source = dir.join("original.pas");
    let target = dir.join("copy.pas");
    fs::write(&source, "program Original;").unwrap();

    let result = copy_path(&source, &target);

    assert!(result.is_ok());
    assert!(source.is_file());
    assert_eq!(fs::read_to_string(&source).unwrap(), "program Original;");
    assert_eq!(fs::read_to_string(&target).unwrap(), "program Original;");
}

#[test]
fn copy_path_copies_a_folder_recursively_including_nested_content() {
    let dir = tmp_dir("copy_folder_recursive");
    let source = dir.join("original_folder");
    let target = dir.join("copied_folder");
    let nested = source.join("nested");
    fs::create_dir_all(&nested).unwrap();
    fs::write(source.join("top.pas"), "program Top;").unwrap();
    fs::write(nested.join("inner.pas"), "program Inner;").unwrap();

    let result = copy_path(&source, &target);

    assert!(result.is_ok());
    // Original untouched.
    assert_eq!(
        fs::read_to_string(source.join("top.pas")).unwrap(),
        "program Top;"
    );
    assert_eq!(
        fs::read_to_string(nested.join("inner.pas")).unwrap(),
        "program Inner;"
    );
    // Copy has the same structure and content.
    assert_eq!(
        fs::read_to_string(target.join("top.pas")).unwrap(),
        "program Top;"
    );
    assert_eq!(
        fs::read_to_string(target.join("nested").join("inner.pas")).unwrap(),
        "program Inner;"
    );
}

#[test]
fn copy_path_fails_with_conflict_message_when_the_destination_already_exists() {
    let dir = tmp_dir("copy_conflict");
    let source = dir.join("original.pas");
    let target = dir.join("existing.pas");
    fs::write(&source, "program Original;").unwrap();
    fs::write(&target, "original content").unwrap();

    let result = copy_path(&source, &target);

    assert_eq!(
        result,
        Err("A file or folder with this name already exists".to_string())
    );
    // Neither the source nor the pre-existing destination were touched.
    assert_eq!(fs::read_to_string(&source).unwrap(), "program Original;");
    assert_eq!(fs::read_to_string(&target).unwrap(), "original content");
}

#[test]
fn is_self_or_descendant_is_true_when_dest_parent_is_the_source_itself() {
    let dir = tmp_dir("self_or_descendant_same");
    let source = dir.join("folder");

    assert!(is_self_or_descendant(&source, &source));
}

#[test]
fn is_self_or_descendant_is_true_for_a_direct_child_of_the_source() {
    let dir = tmp_dir("self_or_descendant_child");
    let source = dir.join("folder");
    let dest_parent = source.join("subfolder");

    assert!(is_self_or_descendant(&dest_parent, &source));
}

#[test]
fn is_self_or_descendant_is_true_for_a_deeper_descendant_of_the_source() {
    let dir = tmp_dir("self_or_descendant_grandchild");
    let source = dir.join("folder");
    let dest_parent = source.join("subfolder").join("nested");

    assert!(is_self_or_descendant(&dest_parent, &source));
}

#[test]
fn is_self_or_descendant_is_false_for_a_sibling_folder() {
    let dir = tmp_dir("self_or_descendant_sibling");
    let source = dir.join("folder");
    let dest_parent = dir.join("other_folder");

    assert!(!is_self_or_descendant(&dest_parent, &source));
}

#[test]
fn is_self_or_descendant_is_false_for_an_unrelated_folder() {
    let dir = tmp_dir("self_or_descendant_unrelated");
    let source = dir.join("folder");
    let dest_parent = std::path::PathBuf::from("/completely/unrelated/path");

    assert!(!is_self_or_descendant(&dest_parent, &source));
}
