use std::path::{Path, PathBuf};

// `authorize_new` is used by the create-file/create-directory commands in
// `application::manage_workspace`. Its sibling `authorize_existing` is still
// unused - it's reserved for the future rename/delete explorer CRUD stage.

/// Characters rejected in a new leaf name, regardless of platform. Windows
/// reserves all of these; we reject them everywhere rather than branching
/// per-OS, since none of them are meaningful in a Pascal project name.
#[allow(dead_code)]
const RESERVED_CHARS: &[char] = &['<', '>', ':', '"', '|', '?', '*', '\0'];

/// Authorizes an operation on a path that must already exist (e.g. opening
/// or deleting a node already present in the explorer tree). Canonicalizes
/// both `root` and `candidate`, then confirms `candidate` is `root` itself
/// or lives underneath it. Returns the canonicalized candidate on success.
#[allow(dead_code)]
pub fn authorize_existing(root: &Path, candidate: &Path) -> Result<PathBuf, String> {
    // dunce::canonicalize, not std::fs::canonicalize - the std version
    // prefixes Windows paths with `\\?\`, which breaks string-based
    // comparisons against paths that came from elsewhere (e.g. a path
    // picked via a file dialog) and aren't similarly prefixed.
    let root_canonical = dunce::canonicalize(root)
        .map_err(|e| format!("Failed to resolve workspace root: {}", e))?;
    let candidate_canonical = dunce::canonicalize(candidate)
        .map_err(|e| format!("Failed to resolve path: {}", e))?;

    if candidate_canonical == root_canonical || candidate_canonical.starts_with(&root_canonical) {
        Ok(candidate_canonical)
    } else {
        Err("Path is outside the workspace".to_string())
    }
}

/// Authorizes a target that does not exist yet (a new file/folder, or a
/// rename/copy/move destination). `parent` must already exist - it's the
/// directory the new entry will live in. `new_name` must be a single safe
/// leaf name; it cannot contain path separators or otherwise escape `parent`.
pub fn authorize_new(root: &Path, parent: &Path, new_name: &str) -> Result<PathBuf, String> {
    // dunce::canonicalize - see the note in authorize_existing above.
    let root_canonical = dunce::canonicalize(root)
        .map_err(|e| format!("Failed to resolve workspace root: {}", e))?;
    let parent_canonical = dunce::canonicalize(parent)
        .map_err(|e| format!("Failed to resolve parent directory: {}", e))?;

    if parent_canonical != root_canonical && !parent_canonical.starts_with(&root_canonical) {
        return Err("Parent directory is outside the workspace".to_string());
    }

    validate_leaf_name(new_name)?;

    Ok(parent_canonical.join(new_name))
}

/// Validates that `name` is a single, safe path-segment leaf name: non-empty,
/// not `.`/`..`, contains no path separator, and excludes characters that
/// are reserved on Windows (rejected everywhere for cross-platform
/// consistency rather than branching per-OS).
fn validate_leaf_name(name: &str) -> Result<(), String> {
    if name.is_empty() {
        return Err("Name cannot be empty".to_string());
    }

    if name == "." || name == ".." {
        return Err("Name cannot be '.' or '..'".to_string());
    }

    if name.contains('/') || name.contains('\\') {
        return Err("Name cannot contain a path separator".to_string());
    }

    if name.chars().any(|c| RESERVED_CHARS.contains(&c)) {
        return Err("Name contains a reserved character".to_string());
    }

    Ok(())
}
