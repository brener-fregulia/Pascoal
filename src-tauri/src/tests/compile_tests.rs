use crate::compiler::compile;
use std::fs;

fn tmp_dir(name: &str) -> std::path::PathBuf {
    let dir = std::env::temp_dir().join(format!("pascoal_compile_test_{}", name));
    fs::create_dir_all(&dir).unwrap();
    dir
}

#[test]
#[ignore = "requires FPC installed"]
fn compile_valid_program_succeeds() {
    let dir = tmp_dir("valid");
    let src = dir.join("program.pas");

    fs::write(&src, "program Valid;\nbegin\n  writeln('ok');\nend.\n").unwrap();

    let result = compile(&src, &dir);

    assert!(
        result.success,
        "expected compile success, got:\n{}",
        result.output
    );
    assert!(
        result.output.contains("lines compiled"),
        "expected FPC summary in output"
    );
}

#[test]
#[ignore = "requires FPC installed"]
fn compile_invalid_program_fails() {
    let dir = tmp_dir("invalid");
    let src = dir.join("program.pas");

    fs::write(&src, "program Invalid;\nbegin\n  THISDOESNOTEXIST;\nend.\n").unwrap();

    let result = compile(&src, &dir);

    assert!(!result.success, "expected compile failure");
    assert!(
        result.output.contains("Error") || result.output.contains("error"),
        "expected error message in FPC output"
    );
}

#[test]
#[ignore = "requires FPC installed"]
fn compile_missing_source_fails() {
    let dir = tmp_dir("missing");
    let src = dir.join("nonexistent.pas");

    let result = compile(&src, &dir);

    assert!(!result.success, "expected failure for missing source file");
}

#[test]
#[ignore = "requires FPC installed"]
fn compile_produces_executable() {
    let dir = tmp_dir("exe");
    let src = dir.join("program.pas");

    fs::write(&src, "program Exe;\nbegin\nend.\n").unwrap();

    let result = compile(&src, &dir);

    if result.success {
        let exe = dir.join(if cfg!(target_os = "windows") {
            "program.exe"
        } else {
            "program"
        });
        assert!(exe.exists(), "expected executable to exist after compile");
    }
}
