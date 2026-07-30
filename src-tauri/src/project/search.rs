use crate::project::IGNORED_DIRS;

#[derive(serde::Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct PasFile {
    name: String,
    path: String,
}

/// Recursively collects every `.pas` file under `dir`, skipping `.git`.
/// Used only by search_in_folder - the explorer tree uses build_tree instead.
fn collect_pas_files(dir: &std::path::Path, root: &std::path::Path) -> Vec<PasFile> {
    let mut files = Vec::new();

    let entries = match std::fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return files,
    };

    let mut sorted: Vec<_> = entries.flatten().collect();
    sorted.sort_by_key(|e| e.file_name());

    for entry in sorted {
        let path = entry.path();
        let file_type = match entry.file_type() {
            Ok(ft) => ft,
            Err(_) => continue,
        };

        let name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string();

        if file_type.is_dir() {
            if IGNORED_DIRS.contains(&name.as_str()) {
                continue;
            }
            files.extend(collect_pas_files(&path, root));
        } else if file_type.is_file() && path.extension().and_then(|e| e.to_str()) == Some("pas") {
            files.push(PasFile {
                name,
                path: path.to_string_lossy().to_string(),
            });
        }
    }

    files
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchMatch {
    pub file_path: String,
    pub file_name: String,
    pub line_number: usize,
    pub line_text: String,
    pub column: usize,
}

pub fn search_in_folder(folder_path: &str, query: &str, case_sensitive: bool) -> Vec<SearchMatch> {
    let mut results = Vec::new();

    if query.trim().is_empty() {
        return results;
    }

    let path = std::path::PathBuf::from(folder_path);
    let files = collect_pas_files(&path, &path);

    let needle = if case_sensitive {
        query.to_string()
    } else {
        query.to_lowercase()
    };

    for file in files {
        let content = match std::fs::read_to_string(&file.path) {
            Ok(c) => c,
            Err(_) => continue,
        };

        for (i, line) in content.lines().enumerate() {
            let haystack = if case_sensitive {
                line.to_string()
            } else {
                line.to_lowercase()
            };

            if let Some(column) = haystack.find(&needle) {
                results.push(SearchMatch {
                    file_path: file.path.clone(),
                    file_name: file.name.clone(),
                    line_number: i + 1,
                    line_text: line.to_string(),
                    column,
                });
            }
        }
    }

    results
}
