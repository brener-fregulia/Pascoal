use crate::fs::list_folder_files;
use std::fs;

fn tmp_dir(name: &str) -> std::path::PathBuf {
    let dir = std::env::temp_dir().join(format!("pascoal_explorer_test_{}", name));
    fs::create_dir_all(&dir).unwrap();
    dir
}

#[test]
fn list_folder_files_returns_pas_files() {
    let dir = tmp_dir("list_pas");
    fs::write(dir.join("main.pas"), "program Main;").unwrap();
    fs::write(dir.join("utils.pas"), "program Utils;").unwrap();
    fs::write(dir.join("readme.txt"), "not pascal").unwrap();

    let files = list_folder_files(dir.to_string_lossy().to_string());

    assert_eq!(files.len(), 2);
    let names: Vec<&str> = files.iter().map(|f| f.name.as_str()).collect();
    assert!(names.contains(&"main.pas"));
    assert!(names.contains(&"utils.pas"));
}

#[test]
fn list_folder_files_ignores_non_pas() {
    let dir = tmp_dir("ignore_non_pas");
    fs::write(dir.join("notes.txt"), "text").unwrap();
    fs::write(dir.join("data.json"), "{}").unwrap();
    fs::write(dir.join("script.sh"), "#!/bin/bash").unwrap();

    let files = list_folder_files(dir.to_string_lossy().to_string());

    assert_eq!(files.len(), 0);
}

#[test]
fn list_folder_files_returns_empty_for_empty_dir() {
    let dir = tmp_dir("empty_dir");
    let files = list_folder_files(dir.to_string_lossy().to_string());
    assert_eq!(files.len(), 0);
}

#[test]
fn list_folder_files_returns_empty_for_invalid_path() {
    let files = list_folder_files("/nonexistent/path/that/does/not/exist".to_string());
    assert_eq!(files.len(), 0);
}

#[test]
fn list_folder_files_returns_correct_relative_paths() {
    let dir = tmp_dir("relative_paths");
    fs::write(dir.join("program.pas"), "program Prog;").unwrap();

    let files = list_folder_files(dir.to_string_lossy().to_string());

    assert_eq!(files.len(), 1);
    assert_eq!(files[0].relative_path, "program.pas");
}

#[test]
fn list_folder_files_are_sorted_alphabetically() {
    let dir = tmp_dir("sorted");
    fs::write(dir.join("zebra.pas"), "").unwrap();
    fs::write(dir.join("alpha.pas"), "").unwrap();
    fs::write(dir.join("middle.pas"), "").unwrap();

    let files = list_folder_files(dir.to_string_lossy().to_string());

    assert_eq!(files[0].name, "alpha.pas");
    assert_eq!(files[1].name, "middle.pas");
    assert_eq!(files[2].name, "zebra.pas");
}
