use crate::toolchain::installer::{detect_package_manager, install_command, run_install};

/// Use case: detect which package manager is available for installing FPC.
pub fn detect_installer() -> Option<String> {
    detect_package_manager().map(|s| s.to_string())
}

/// Use case: kick off an FPC install in the background, emitting
/// fpc-install-* events as it progresses.
pub fn install_fpc(app: tauri::AppHandle) -> Result<(), String> {
    let pm = detect_package_manager().ok_or_else(|| "no_package_manager".to_string())?;
    let (program, args) =
        install_command(pm).ok_or_else(|| "unsupported_package_manager".to_string())?;

    std::thread::spawn(move || run_install(app, program, args));

    Ok(())
}
