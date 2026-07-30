// Prevents a console window from flashing when spawning child processes
// (fpc, where, winget, pkexec...) from a GUI-subsystem app on Windows.
// No-op on other platforms.

#[cfg(target_os = "windows")]
pub fn no_window(mut cmd: std::process::Command) -> std::process::Command {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    cmd.creation_flags(CREATE_NO_WINDOW);
    cmd
}

#[cfg(not(target_os = "windows"))]
pub fn no_window(cmd: std::process::Command) -> std::process::Command {
    cmd
}
