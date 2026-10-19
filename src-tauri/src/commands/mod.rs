// Command dispatch convention
//
// A `#[tauri::command]` without `async` runs inline on the webview's IPC
// handler - the UI thread - so any command that spawns a process, touches
// the filesystem or parses a document freezes the whole window while it
// runs. Every such command here is declared `#[tauri::command(async)]`,
// which keeps the function itself synchronous (and directly unit-testable)
// while Tauri dispatches it to the async runtime's thread pool.
//
// `process_commands::send_input` is the deliberate exception: it is a cheap
// write to the running program's PTY and is kept inline so concurrent
// keystrokes cannot be reordered by the thread pool.

pub mod git_commands;
pub mod installer_commands;
pub mod language_commands;
pub mod process_commands;
pub mod project_commands;
pub mod settings_commands;
pub mod toolchain_commands;
