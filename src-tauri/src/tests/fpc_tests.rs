use crate::detect_fpc;

#[test]
fn detect_fpc_returns_tuple() {
    let (installed, version) = detect_fpc();
    if installed {
        assert!(version.is_some(), "FPC installed but version is None");
        let v = version.unwrap();
        assert!(!v.is_empty(), "FPC version string should not be empty");
    } else {
        assert!(version.is_none(), "FPC not installed but version is Some");
    }
}

#[test]
fn detect_fpc_does_not_panic() {
    let result = std::panic::catch_unwind(detect_fpc);
    assert!(result.is_ok(), "detect_fpc should never panic");
}
