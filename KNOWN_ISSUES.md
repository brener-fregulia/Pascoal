# Known Issues

## Window position and size are not reliably restored on Linux (Wayland)

- Wayland does not let applications read or set the global window position, so
  the saved position is not restored; the compositor places the window.
- Window size and maximized state are saved and restored. Closing the window
  right after opening it can store an intermediate position or size while the
  window is still being placed.
- Reported on CachyOS during development (`tauri dev`). Windows 11 and X11 are
  expected to restore position, size and maximized state normally.
