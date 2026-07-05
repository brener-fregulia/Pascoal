use crate::fs::search_in_folder;
use std::fs;

fn tmp_dir(name: &str) -> std::path::PathBuf {
    let dir = std::env::temp_dir().join(format!("pascoal_search_test_{}", name));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    dir
}

#[test]
fn finds_matches_in_single_file() {
    let dir = tmp_dir("single_file");
    fs::write(
        dir.join("main.pas"),
        "program Main;\nbegin\n  writeln('hello');\nend.\n",
    )
    .unwrap();

    let results = search_in_folder(
        dir.to_string_lossy().to_string(),
        "writeln".to_string(),
        false,
    );

    assert_eq!(results.len(), 1);
    assert_eq!(results[0].file_name, "main.pas");
    assert_eq!(results[0].line_number, 3);
}

#[test]
fn finds_matches_across_multiple_files() {
    let dir = tmp_dir("multi_file");
    fs::write(dir.join("main.pas"), "writeln('a');\n").unwrap();
    fs::write(dir.join("utils.pas"), "writeln('b');\nwriteln('c');\n").unwrap();

    let results = search_in_folder(
        dir.to_string_lossy().to_string(),
        "writeln".to_string(),
        false,
    );

    assert_eq!(results.len(), 3);
}

#[test]
fn finds_matches_in_subfolders() {
    let dir = tmp_dir("subfolder_search");
    let sub = dir.join("src");
    fs::create_dir(&sub).unwrap();
    fs::write(sub.join("utils.pas"), "writeln('nested');\n").unwrap();

    let results = search_in_folder(
        dir.to_string_lossy().to_string(),
        "writeln".to_string(),
        false,
    );

    assert_eq!(results.len(), 1);
    assert_eq!(results[0].file_name, "utils.pas");
}

#[test]
fn returns_empty_for_no_matches() {
    let dir = tmp_dir("no_matches");
    fs::write(dir.join("main.pas"), "program Main;\nbegin\nend.\n").unwrap();

    let results = search_in_folder(
        dir.to_string_lossy().to_string(),
        "nonexistent_term".to_string(),
        false,
    );

    assert_eq!(results.len(), 0);
}

#[test]
fn returns_empty_for_empty_query() {
    let dir = tmp_dir("empty_query");
    fs::write(dir.join("main.pas"), "writeln('a');\n").unwrap();

    let results = search_in_folder(dir.to_string_lossy().to_string(), "".to_string(), false);

    assert_eq!(results.len(), 0);
}

#[test]
fn case_insensitive_by_default() {
    let dir = tmp_dir("case_insensitive");
    fs::write(dir.join("main.pas"), "WriteLn('a');\n").unwrap();

    let results = search_in_folder(
        dir.to_string_lossy().to_string(),
        "writeln".to_string(),
        false,
    );

    assert_eq!(results.len(), 1);
}

#[test]
fn case_sensitive_when_enabled() {
    let dir = tmp_dir("case_sensitive");
    fs::write(dir.join("main.pas"), "WriteLn('a');\n").unwrap();

    let results = search_in_folder(
        dir.to_string_lossy().to_string(),
        "writeln".to_string(),
        true,
    );

    assert_eq!(results.len(), 0);
}

#[test]
fn ignores_non_pas_files() {
    let dir = tmp_dir("ignore_non_pas");
    fs::write(dir.join("notes.txt"), "writeln this is not pascal\n").unwrap();

    let results = search_in_folder(
        dir.to_string_lossy().to_string(),
        "writeln".to_string(),
        false,
    );

    assert_eq!(results.len(), 0);
}

#[test]
fn ignores_git_directory() {
    let dir = tmp_dir("ignore_git");
    let git_dir = dir.join(".git");
    fs::create_dir(&git_dir).unwrap();
    fs::write(git_dir.join("fake.pas"), "writeln('should not match');\n").unwrap();

    let results = search_in_folder(
        dir.to_string_lossy().to_string(),
        "writeln".to_string(),
        false,
    );

    assert_eq!(results.len(), 0);
}

#[test]
fn returns_correct_column_position() {
    let dir = tmp_dir("column_position");
    fs::write(dir.join("main.pas"), "  writeln('a');\n").unwrap();

    let results = search_in_folder(
        dir.to_string_lossy().to_string(),
        "writeln".to_string(),
        false,
    );

    assert_eq!(results.len(), 1);
    assert_eq!(results[0].column, 2);
}
