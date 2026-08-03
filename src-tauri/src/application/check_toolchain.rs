use crate::infrastructure::environment::{detect_fpc, resolve_executable_path};
use crate::infrastructure::git::detect_git_version;

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolStatus {
    pub installed: bool,
    pub version: Option<String>,
    pub path: Option<String>,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolchainStatus {
    pub fpc: ToolStatus,
    pub git: ToolStatus,
}

pub fn get_toolchain_status() -> ToolchainStatus {
    let (fpc_installed, fpc_version) = detect_fpc();
    let (git_installed, git_version) = detect_git_version();

    ToolchainStatus {
        fpc: ToolStatus {
            installed: fpc_installed,
            version: fpc_version,
            path: resolve_executable_path("fpc"),
        },
        git: ToolStatus {
            installed: git_installed,
            version: git_version,
            path: resolve_executable_path("git"),
        },
    }
}
