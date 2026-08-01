use crate::application::install_toolchain::detect_installer;
use crate::toolchain::installer::install_command;

#[test]
fn install_command_maps_winget() {
    let (program, args) = install_command("winget").unwrap();
    assert_eq!(program, "winget");
    assert!(args.contains(&"install"));
    assert!(args.iter().any(|a| a.contains("FreePascal")));
}

#[test]
fn install_command_maps_apt_get_through_pkexec() {
    let (program, args) = install_command("apt-get").unwrap();
    assert_eq!(program, "pkexec");
    assert!(args.contains(&"apt-get"));
    assert!(args.contains(&"fpc"));
}

#[test]
fn install_command_maps_pacman_through_pkexec() {
    let (program, args) = install_command("pacman").unwrap();
    assert_eq!(program, "pkexec");
    assert!(args.contains(&"pacman"));
}

#[test]
fn install_command_maps_dnf_through_pkexec() {
    let (program, _) = install_command("dnf").unwrap();
    assert_eq!(program, "pkexec");
}

#[test]
fn install_command_maps_zypper_through_pkexec() {
    let (program, _) = install_command("zypper").unwrap();
    assert_eq!(program, "pkexec");
}

#[test]
fn install_command_returns_none_for_unknown_package_manager() {
    assert!(install_command("some-unknown-pm").is_none());
}

#[test]
fn detect_installer_does_not_panic() {
    // Result depends entirely on what's installed on the machine running
    // the test (winget on Windows, apt-get/pacman/dnf/zypper on Linux, or
    // none) - same spirit as fpc_tests::detect_fpc_does_not_panic. Just
    // confirms it returns without panicking.
    let result = std::panic::catch_unwind(detect_installer);
    assert!(result.is_ok());
}
