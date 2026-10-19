use std::fs;
use std::path::{Path, PathBuf};

// A `#[tauri::command]` declared without `async` is executed inline on the
// webview's IPC handler - the UI thread - so a command that spawns `git`,
// `fpc` or walks a folder freezes the whole window while it runs. Every
// command that does real work is therefore declared
// `#[tauri::command(async)]`, which keeps the function synchronous (and
// unit-testable as a plain call) while Tauri runs it on the async
// runtime's thread pool.
//
// This test reads the command modules themselves because the distinction
// only exists in the attribute: the generated wrapper is what changes, not
// anything observable from the function signature.

// Cheap PTY write for the running program's stdin, kept inline so two
// keystrokes dispatched concurrently cannot be reordered by the pool.
const INLINE_ALLOWED: &[&str] = &["send_input"];

/// Every file that declares `#[tauri::command]`: the command modules plus
/// `lib.rs`, which hosts `get_app_info`.
fn command_sources() -> Vec<PathBuf> {
    let src = Path::new(env!("CARGO_MANIFEST_DIR")).join("src");
    let mut sources = vec![src.join("lib.rs")];

    for entry in fs::read_dir(src.join("commands")).unwrap() {
        let path = entry.unwrap().path();
        if path.extension().and_then(|e| e.to_str()) == Some("rs") {
            sources.push(path);
        }
    }

    sources
}

/// Returns the names of the commands in `source` declared with a bare
/// `#[tauri::command]` on a synchronous function.
fn inline_commands(source: &str) -> Vec<String> {
    let mut found = Vec::new();
    let mut lines = source.lines().peekable();

    while let Some(line) = lines.next() {
        if line.trim() != "#[tauri::command]" {
            continue;
        }
        let Some(next) = lines.peek() else { continue };
        let next = next.trim();
        let declaration = next.strip_prefix("pub ").unwrap_or(next);
        if let Some(rest) = declaration.strip_prefix("fn ") {
            let name = rest.split('(').next().unwrap_or("").trim().to_string();
            found.push(name);
        }
    }

    found
}

#[test]
fn every_working_command_is_dispatched_off_the_ui_thread() {
    let mut offenders = Vec::new();

    for path in command_sources() {
        let source = fs::read_to_string(&path).unwrap();
        for name in inline_commands(&source) {
            if !INLINE_ALLOWED.contains(&name.as_str()) {
                offenders.push(format!(
                    "{}::{}",
                    path.file_name().unwrap().to_string_lossy(),
                    name
                ));
            }
        }
    }

    assert!(
        offenders.is_empty(),
        "these synchronous commands still run on the UI thread - mark them \
         `#[tauri::command(async)]`: {:?}",
        offenders
    );
}

#[test]
fn inline_command_detection_spots_only_bare_sync_commands() {
    let source = concat!(
        "#[tauri::command]\npub fn blocking_one(path: String) -> bool {}\n",
        "#[tauri::command]\nfn blocking_two() -> bool {}\n",
        "#[tauri::command(async)]\npub fn dispatched_one(path: String) -> bool {}\n",
        "#[tauri::command]\npub async fn already_async() {}\n",
    );

    assert_eq!(
        inline_commands(source),
        vec!["blocking_one".to_string(), "blocking_two".to_string()]
    );
}
