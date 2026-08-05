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

pub fn status(folder_path: &str) -> GitStatusResult {
    let is_repo = run_git(folder_path, &["rev-parse", "--is-inside-work-tree"])
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

    let branch = run_git(folder_path, &["branch", "--show-current"])
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let mut staged = Vec::new();
    let mut unstaged = Vec::new();

    if let Ok(output) = run_git(folder_path, &["status", "--porcelain=v2", "-z"]) {
        let mut records = output.split('\0').filter(|r| !r.is_empty());

        while let Some(record) = records.next() {
            let mut head = record.splitn(2, ' ');
            let kind = head.next().unwrap_or("");
            let rest = head.next().unwrap_or("");

            match kind {
                // Ordinary changed entry: XY sub mH mI mW hH hI path
                "1" => {
                    let mut fields = rest.splitn(8, ' ');
                    let xy = fields.next().unwrap_or("");
                    let path = fields.nth(6).unwrap_or("").to_string();
                    push_status(&mut staged, &mut unstaged, xy, path);
                }
                // Renamed/copied entry: XY sub mH mI mW hH hI Xscore path
                // - origPath follows as its own NUL-terminated record.
                "2" => {
                    let mut fields = rest.splitn(9, ' ');
                    let xy = fields.next().unwrap_or("");
                    let path = fields.nth(7).unwrap_or("").to_string();
                    let _orig_path = records.next();
                    push_status(&mut staged, &mut unstaged, xy, path);
                }
                // Unmerged entry: XY sub m1 m2 m3 mW h1 h2 h3 path
                "u" => {
                    let mut fields = rest.splitn(10, ' ');
                    let xy = fields.next().unwrap_or("");
                    let path = fields.nth(8).unwrap_or("").to_string();
                    push_status(&mut staged, &mut unstaged, xy, path);
                }
                // Untracked: just the path.
                "?" => {
                    unstaged.push(GitFileStatus {
                        path: rest.to_string(),
                        status: "untracked".to_string(),
                    });
                }
                _ => {}
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

fn push_status(
    staged: &mut Vec<GitFileStatus>,
    unstaged: &mut Vec<GitFileStatus>,
    xy: &str,
    path: String,
) {
    let mut chars = xy.chars();
    let x = chars.next().unwrap_or('.');
    let y = chars.next().unwrap_or('.');

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
pub fn diff(folder_path: &str, file_path: &str, staged: bool) -> Result<String, String> {
    let mut args = vec!["diff"];
    if staged {
        args.push("--cached");
    }
    args.push("--");
    args.push(file_path);
    run_git(folder_path, &args)
}

pub fn stage(folder_path: &str, file_path: &str) -> Result<(), String> {
    run_git(folder_path, &["add", "--", file_path]).map(|_| ())
}

pub fn unstage(folder_path: &str, file_path: &str) -> Result<(), String> {
    let has_head = run_git(folder_path, &["rev-parse", "--verify", "HEAD"]).is_ok();

    if has_head {
        run_git(folder_path, &["restore", "--staged", "--", file_path]).map(|_| ())
    } else {
        // No commits yet - nothing to "restore" from, just unstage via reset
        run_git(folder_path, &["rm", "--cached", "--", file_path]).map(|_| ())
    }
}

pub fn stage_all(folder_path: &str) -> Result<(), String> {
    run_git(folder_path, &["add", "-A"]).map(|_| ())
}

pub fn unstage_all(folder_path: &str) -> Result<(), String> {
    let has_head = run_git(folder_path, &["rev-parse", "--verify", "HEAD"]).is_ok();

    if has_head {
        run_git(folder_path, &["restore", "--staged", "."]).map(|_| ())
    } else {
        run_git(folder_path, &["rm", "--cached", "-r", "."]).map(|_| ())
    }
}

pub fn commit(folder_path: &str, message: &str) -> Result<(), String> {
    if message.trim().is_empty() {
        return Err("Commit message cannot be empty".to_string());
    }
    run_git(folder_path, &["commit", "-m", message]).map(|_| ())
}

pub fn init(folder_path: &str) -> Result<(), String> {
    run_git(folder_path, &["init", "-b", "main"]).map(|_| ())
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
pub fn check_identity(folder_path: &str) -> GitIdentity {
    let name = run_git(folder_path, &["config", "user.name"])
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let email = run_git(folder_path, &["config", "user.email"])
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    GitIdentity { name, email }
}

pub fn set_identity(
    folder_path: &str,
    name: &str,
    email: &str,
    global: bool,
) -> Result<(), String> {
    let scope_flag = if global { "--global" } else { "--local" };
    run_git(folder_path, &["config", scope_flag, "user.name", name])?;
    run_git(folder_path, &["config", scope_flag, "user.email", email])?;
    Ok(())
}

/// Reads the global (per-user) git identity, independent of any
/// folder or repository.
pub fn check_global_identity() -> GitIdentity {
    let cwd = std::env::temp_dir();
    let cwd = cwd.to_str().unwrap_or(".");

    let name = run_git(cwd, &["config", "--global", "user.name"])
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let email = run_git(cwd, &["config", "--global", "user.email"])
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    GitIdentity { name, email }
}

/// Reads the local (per-repository) identity only, without falling
/// back to the global value the way `check_identity` does.
pub fn check_local_identity(folder_path: &str) -> GitIdentity {
    let name = run_git(folder_path, &["config", "--local", "user.name"])
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let email = run_git(folder_path, &["config", "--local", "user.email"])
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    GitIdentity { name, email }
}

/// Writes the global (per-user) identity, independent of any folder.
pub fn set_global_identity(name: &str, email: &str) -> Result<(), String> {
    let cwd = std::env::temp_dir();
    let cwd = cwd.to_str().unwrap_or(".");

    run_git(cwd, &["config", "--global", "user.name", name])?;
    run_git(cwd, &["config", "--global", "user.email", email])?;
    Ok(())
}

/// Detects whether git is installed and, if so, its reported version
/// (e.g. "2.43.0").
pub fn detect_git_version() -> (bool, Option<String>) {
    let output = Command::new("git").arg("--version").output();

    match output {
        Ok(o) if o.status.success() => {
            let raw = String::from_utf8(o.stdout)
                .ok()
                .map(|s| s.trim().to_string());
            let version =
                raw.and_then(|s| s.strip_prefix("git version ").map(|v| v.trim().to_string()));
            (true, version)
        }
        _ => (false, None),
    }
}

/// Reads a file's content at a given git revision spec (e.g. "HEAD", or
/// an empty string for the index/staging area), via `git show`.
pub fn show_file(folder_path: &str, revision: &str, file_path: &str) -> Result<String, String> {
    run_git(
        folder_path,
        &["show", &format!("{}:{}", revision, file_path)],
    )
}

/// Discards unstaged changes in a tracked file, restoring it to match
/// the index.
pub fn discard(folder_path: &str, file_path: &str) -> Result<(), String> {
    run_git(folder_path, &["restore", "--", file_path])?;
    Ok(())
}

/// Reads the URL of the "origin" remote, if configured.
pub fn get_remote(folder_path: &str) -> Option<String> {
    run_git(folder_path, &["remote", "get-url", "origin"])
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

/// Points "origin" at the given URL, adding it if it doesn't exist yet.
pub fn set_remote(folder_path: &str, url: &str) -> Result<(), String> {
    if run_git(folder_path, &["remote", "set-url", "origin", url]).is_err() {
        run_git(folder_path, &["remote", "add", "origin", url])?;
    }
    Ok(())
}

pub fn push(folder_path: &str, branch: &str) -> Result<String, String> {
    match run_git(folder_path, &["push"]) {
        Ok(out) => Ok(out),
        Err(e) => {
            if e.contains("has no upstream branch") {
                run_git(folder_path, &["push", "--set-upstream", "origin", branch])
            } else {
                Err(e)
            }
        }
    }
}

pub fn pull(folder_path: &str, branch: &str) -> Result<String, String> {
    match run_git(folder_path, &["pull"]) {
        Ok(out) => Ok(out),
        Err(e) if e.contains("no tracking information") => {
            // Try the remote branch with the same name first.
            match run_git(folder_path, &["pull", "origin", branch]) {
                Ok(out) => {
                    set_upstream(folder_path, branch, branch);
                    Ok(out)
                }
                // Local and remote default branch names don't match
                // (e.g. local "master" vs a GitHub repo's "main") -
                // find the remote's actual default branch and use that.
                Err(_) => {
                    let remote_branch = default_remote_branch(folder_path)?;
                    let out = run_git(folder_path, &["pull", "origin", &remote_branch])?;
                    set_upstream(folder_path, branch, &remote_branch);
                    Ok(out)
                }
            }
        }
        Err(e) => Err(e),
    }
}

fn set_upstream(folder_path: &str, local_branch: &str, remote_branch: &str) {
    let _ = run_git(
        folder_path,
        &[
            "branch",
            "--set-upstream-to",
            &format!("origin/{}", remote_branch),
            local_branch,
        ],
    );
}

fn default_remote_branch(folder_path: &str) -> Result<String, String> {
    let out = run_git(folder_path, &["ls-remote", "--symref", "origin", "HEAD"])?;
    out.lines()
        .find_map(|line| {
            line.strip_prefix("ref: refs/heads/")
                .and_then(|s| s.split('\t').next())
        })
        .map(|s| s.to_string())
        .ok_or_else(|| "Could not determine the remote's default branch".to_string())
}

pub fn ahead_behind(folder_path: &str) -> Option<(u32, u32)> {
    let output = run_git(
        folder_path,
        &["status", "--porcelain=v2", "--branch", "-uno"],
    )
    .ok()?;

    for line in output.lines() {
        if let Some(rest) = line.strip_prefix("# branch.ab ") {
            let mut parts = rest.split_whitespace();
            let ahead = parts.next()?.strip_prefix('+')?.parse().ok()?;
            let behind = parts.next()?.strip_prefix('-')?.parse().ok()?;
            return Some((ahead, behind));
        }
    }

    None
}

pub fn fetch(folder_path: &str) -> Result<(), String> {
    run_git(folder_path, &["fetch"])?;
    Ok(())
}
