use std::path::Path;

/// Whether the window-state plugin's file already holds an entry for `label`.
///
/// A missing, unreadable or malformed file counts as "no saved state", so the
/// window falls back to the first-launch placement instead of staying unplaced.
pub fn has_saved_window(state_file: &Path, label: &str) -> bool {
    std::fs::read_to_string(state_file)
        .ok()
        .and_then(|content| serde_json::from_str::<serde_json::Value>(&content).ok())
        .map(|value| value.get(label).is_some_and(|entry| entry.is_object()))
        .unwrap_or(false)
}
