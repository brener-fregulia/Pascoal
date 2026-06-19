/// Integration tests for Pascal programs.
///
/// Each test case lives in tests/pascal/scripts/<name>/
/// containing:
///   - <name>.pas   — the Pascal source
///   - specs.json   — stdin, expected stdout and exit code
///
/// Build artifacts go to tests/pascal/build/ (git-ignored).
///
/// Run with:
///   cargo test --test pascal_runner -- --nocapture
///
/// Requirements:
///   - FPC (Free Pascal Compiler) must be installed and in PATH.
use std::{
    fs,
    io::Write,
    path::{Path, PathBuf},
    process::{Command, Stdio},
};

use serde::Deserialize;

// ── Spec deserialization ─────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
struct Spec {
    program: String,
    description: String,
    stdin: Vec<String>,
    expect_stdout: Vec<String>,
    expect_exit_code: i32,
    #[serde(default)]
    expect_compile_failure: bool,
}

// ── Helpers ──────────────────────────────────────────────────────────────────

fn workspace_root() -> PathBuf {
    // CARGO_MANIFEST_DIR points to src-tauri/; parent is workspace root.
    let manifest = std::env::var("CARGO_MANIFEST_DIR")
        .expect("CARGO_MANIFEST_DIR not set — run via cargo test");
    PathBuf::from(manifest)
        .parent()
        .expect("src-tauri has no parent directory")
        .to_path_buf()
}

fn scripts_dir() -> PathBuf {
    workspace_root()
        .join("tests")
        .join("pascal")
        .join("scripts")
}

fn build_dir() -> PathBuf {
    let dir = workspace_root().join("tests").join("pascal").join("build");
    fs::create_dir_all(&dir).expect("failed to create build dir");
    dir
}

fn fpc_bin() -> &'static str {
    if cfg!(target_os = "windows") {
        "fpc.exe"
    } else {
        "fpc"
    }
}

/// Derive the executable name FPC will produce from the source filename.
/// FPC names the exe after the source file (without extension).
/// On Windows: <name>.exe — on Unix: <name>
fn exe_name_for(pas_filename: &str) -> String {
    let stem = Path::new(pas_filename)
        .file_stem()
        .unwrap()
        .to_str()
        .unwrap();
    if cfg!(target_os = "windows") {
        format!("{}.exe", stem)
    } else {
        stem.to_string()
    }
}

/// Compile a Pascal source file with FPC.
/// Uses -FE<dir> to put the output in build/<case>/.
/// Returns (success, combined_output).
fn compile(src: &Path, out_dir: &Path) -> (bool, String) {
    let exe = out_dir.join(exe_name_for(src.file_name().unwrap().to_str().unwrap()));

    // Remove stale executable
    if exe.exists() {
        let _ = fs::remove_file(&exe);
    }

    let output = Command::new(fpc_bin())
        .args([
            src.to_str().unwrap(),
            &format!("-FE{}", out_dir.to_str().unwrap()),
        ])
        .current_dir(out_dir)
        .output()
        .expect("failed to spawn FPC — is it installed and in PATH?");

    let text = format!(
        "{}{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr),
    );

    let success = output.status.success() && exe.exists();
    (success, text)
}

/// Run the compiled executable, feeding stdin lines and capturing stdout.
/// Returns (exit_code, stdout_lines).
fn run(exe: &Path, stdin_lines: &[String]) -> (i32, Vec<String>) {
    let mut child = Command::new(exe)
        .current_dir(exe.parent().unwrap())
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("failed to spawn compiled program");

    // Write all stdin lines
    if let Some(mut stdin) = child.stdin.take() {
        for line in stdin_lines {
            writeln!(stdin, "{}", line).ok();
        }
    }

    let output = child
        .wait_with_output()
        .expect("failed to wait for program");

    let exit_code = output.status.code().unwrap_or(1);
    let stdout = String::from_utf8_lossy(&output.stdout);

    // Normalise: split lines, trim trailing \r (Windows CRLF), drop empty trailing line
    let lines: Vec<String> = stdout
        .lines()
        .map(|l| l.trim_end_matches('\r').to_string())
        .collect();

    (exit_code, lines)
}

/// Core test runner — loads spec, compiles, runs and asserts.
fn run_test_case(case_name: &str) {
    let case_dir = scripts_dir().join(case_name);
    let spec_path = case_dir.join("specs.json");

    assert!(
        spec_path.exists(),
        "specs.json not found for case '{}'",
        case_name
    );

    let spec_raw = fs::read_to_string(&spec_path)
        .unwrap_or_else(|_| panic!("failed to read specs.json for '{}'", case_name));
    let spec: Spec = serde_json::from_str(&spec_raw)
        .unwrap_or_else(|e| panic!("invalid specs.json for '{}': {}", case_name, e));

    println!("\n── {} ──", case_name);
    println!("   {}", spec.description);

    let src = case_dir.join(&spec.program);
    assert!(
        src.exists(),
        "Pascal source '{}' not found in '{}'",
        spec.program,
        case_dir.display()
    );

    // Each case gets its own subdirectory in build/ to avoid name collisions
    let out_dir = build_dir().join(case_name);
    fs::create_dir_all(&out_dir).expect("failed to create case build dir");

    // ── Compile ──────────────────────────────────────────────────────────────
    let (compile_ok, compile_output) = compile(&src, &out_dir);

    println!("   FPC output:\n{}", compile_output.trim());

    if spec.expect_compile_failure {
        assert!(
            !compile_ok,
            "Expected compilation to fail for '{}', but it succeeded",
            case_name
        );
        println!("   ✓ Compilation failed as expected");
        return;
    }

    assert!(
        compile_ok,
        "Compilation failed for '{}'\n--- FPC output ---\n{}",
        case_name, compile_output
    );

    println!("   ✓ Compilation succeeded");

    // ── Run ──────────────────────────────────────────────────────────────────
    let exe = out_dir.join(exe_name_for(&spec.program));
    let (exit_code, stdout_lines) = run(&exe, &spec.stdin);

    println!("   stdout lines: {:?}", stdout_lines);

    // ── Assert exit code ─────────────────────────────────────────────────────
    assert_eq!(
        exit_code, spec.expect_exit_code,
        "Exit code mismatch for '{}': got {}, expected {}",
        case_name, exit_code, spec.expect_exit_code
    );

    // ── Assert stdout (exact match per line) ─────────────────────────────────
    assert_eq!(
        stdout_lines.len(),
        spec.expect_stdout.len(),
        "stdout line count mismatch for '{}':\n  got    ({} lines): {:?}\n  expect ({} lines): {:?}",
        case_name,
        stdout_lines.len(),
        stdout_lines,
        spec.expect_stdout.len(),
        spec.expect_stdout
    );

    for (i, (got, expected)) in stdout_lines
        .iter()
        .zip(spec.expect_stdout.iter())
        .enumerate()
    {
        assert_eq!(
            got,
            expected,
            "stdout line {} mismatch for '{}':\n  got:      {:?}\n  expected: {:?}",
            i + 1,
            case_name,
            got,
            expected
        );
    }

    println!("   ✓ stdout matches");
}

// ── Test cases ───────────────────────────────────────────────────────────────

#[test]
fn test_readln_integer() {
    run_test_case("readln_integer");
}

#[test]
fn test_format_real() {
    run_test_case("format_real");
}

#[test]
fn test_multiple_inputs() {
    run_test_case("multiple_inputs");
}

#[test]
fn test_compile_error() {
    run_test_case("compile_error");
}

#[test]
fn test_divide_by_zero() {
    run_test_case("divide_by_zero");
}

#[test]
fn test_invalid_input() {
    run_test_case("invalid_input");
}
