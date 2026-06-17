# Known Issues

## Console buffering on Linux
Pascal programs using `write()` (without `writeln`) do not display output
before `readln` on Linux when running via pipes. The stdout buffer is held
by the Pascal runtime and not flushed until the program exits.

**Workaround:** use `writeln` instead of `write` for prompts.  
**To investigate:** `unbuffer` (from `expect` package), Pascal unit injection,
or PTY for program execution on Linux.

---

## Frontend tests outdated
Unit tests reference old store names (`terminalStore`, `clearTerminalSignal`)
after rename to `programConsoleStore`. Tests need to be updated to reflect
the new console architecture.