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

// Forcefully terminates a process by PID, used to reap a still-running
// compiled program before rebuilding it - otherwise the OS keeps the old
// executable's file locked (Windows) and the next compile's link step
// fails to overwrite it.
#[cfg(target_os = "windows")]
pub fn kill_process(pid: u32) {
    let _ = no_window(std::process::Command::new("taskkill"))
        .args(["/F", "/T", "/PID", &pid.to_string()])
        .output();
}

#[cfg(not(target_os = "windows"))]
pub fn kill_process(pid: u32) {
    let _ = std::process::Command::new("kill")
        .args(["-9", &pid.to_string()])
        .output();
}
