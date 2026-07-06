use std::process::Command;

#[derive(serde::Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GitFileStatus {
    pub path: String,
    pub status: String,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitStatusResult {
    pub is_repo: bool,
    pub branch: Option<String>,
    pub staged: Vec<GitFileStatus>,
    pub unstaged: Vec<GitFileStatus>,
}

fn run_git(folder: &str, args: &[&str]) -> Result<String, String> {
    let output = Command::new("git")
        .args(args)
        .current_dir(folder)
        .output()
        .map_err(|e| format!("Failed to run git: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(if stderr.is_empty() {
            "git command failed".to_string()
        } else {
            stderr
        });
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

fn status_code_to_label(code: char) -> Option<&'static str> {
    match code {
        'M' => Some("modified"),
        'A' => Some("added"),
        'D' => Some("deleted"),
        'R' => Some("renamed"),
        'C' => Some("added"),
        'U' => Some("unmerged"),
        _ => None,
    }
}

#[tauri::command]
pub fn git_status(folder_path: String) -> GitStatusResult {
    let is_repo = run_git(&folder_path, &["rev-parse", "--is-inside-work-tree"])
        .map(|s| s.trim() == "true")
        .unwrap_or(false);

    if !is_repo {
        return GitStatusResult {
            is_repo: false,
            branch: None,
            staged: Vec::new(),
            unstaged: Vec::new(),
        };
    }

    let branch = run_git(&folder_path, &["branch", "--show-current"])
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let mut staged = Vec::new();
    let mut unstaged = Vec::new();

    if let Ok(output) = run_git(&folder_path, &["status", "--porcelain=v1"]) {
        for line in output.lines() {
            if line.len() < 4 {
                continue;
            }
            let mut chars = line.chars();
            let x = chars.next().unwrap();
            let y = chars.next().unwrap();
            let path = line[3..].to_string();

            if x == '?' && y == '?' {
                unstaged.push(GitFileStatus {
                    path,
                    status: "untracked".to_string(),
                });
                continue;
            }

            if let Some(label) = status_code_to_label(x) {
                staged.push(GitFileStatus {
                    path: path.clone(),
                    status: label.to_string(),
                });
            }

            if let Some(label) = status_code_to_label(y) {
                unstaged.push(GitFileStatus {
                    path,
                    status: label.to_string(),
                });
            }
        }
    }

    GitStatusResult {
        is_repo: true,
        branch,
        staged,
        unstaged,
    }
}

#[tauri::command]
pub fn git_diff(folder_path: String, file_path: String, staged: bool) -> Result<String, String> {
    let mut args = vec!["diff"];
    if staged {
        args.push("--cached");
    }
    args.push("--");
    args.push(&file_path);
    run_git(&folder_path, &args)
}

#[tauri::command]
pub fn git_stage(folder_path: String, file_path: String) -> Result<(), String> {
    run_git(&folder_path, &["add", "--", &file_path]).map(|_| ())
}

#[tauri::command]
pub fn git_unstage(folder_path: String, file_path: String) -> Result<(), String> {
    let has_head = run_git(&folder_path, &["rev-parse", "--verify", "HEAD"]).is_ok();

    if has_head {
        run_git(&folder_path, &["restore", "--staged", "--", &file_path]).map(|_| ())
    } else {
        // No commits yet - nothing to "restore" from, just unstage via reset
        run_git(&folder_path, &["rm", "--cached", "--", &file_path]).map(|_| ())
    }
}

#[tauri::command]
pub fn git_stage_all(folder_path: String) -> Result<(), String> {
    run_git(&folder_path, &["add", "-A"]).map(|_| ())
}

#[tauri::command]
pub fn git_unstage_all(folder_path: String) -> Result<(), String> {
    let has_head = run_git(&folder_path, &["rev-parse", "--verify", "HEAD"]).is_ok();

    if has_head {
        run_git(&folder_path, &["restore", "--staged", "."]).map(|_| ())
    } else {
        run_git(&folder_path, &["rm", "--cached", "-r", "."]).map(|_| ())
    }
}

#[tauri::command]
pub fn git_commit(folder_path: String, message: String) -> Result<(), String> {
    if message.trim().is_empty() {
        return Err("Commit message cannot be empty".to_string());
    }
    run_git(&folder_path, &["commit", "-m", &message]).map(|_| ())
}

#[tauri::command]
pub fn git_init(folder_path: String) -> Result<(), String> {
    run_git(&folder_path, &["init"]).map(|_| ())
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitIdentity {
    pub name: Option<String>,
    pub email: Option<String>,
}

/// Reads the *effective* user.name/user.email - git config already
/// resolves local (--local) over global (--global) when no scope flag
/// is given, so this reflects exactly what `git commit` would use.
#[tauri::command]
pub fn git_check_identity(folder_path: String) -> GitIdentity {
    let name = run_git(&folder_path, &["config", "user.name"])
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let email = run_git(&folder_path, &["config", "user.email"])
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    GitIdentity { name, email }
}

#[tauri::command]
pub fn git_set_identity(
    folder_path: String,
    name: String,
    email: String,
    global: bool,
) -> Result<(), String> {
    let scope_flag = if global { "--global" } else { "--local" };
    run_git(&folder_path, &["config", scope_flag, "user.name", &name])?;
    run_git(&folder_path, &["config", scope_flag, "user.email", &email])?;
    Ok(())
}
