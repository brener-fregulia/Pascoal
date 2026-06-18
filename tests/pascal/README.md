# Pascal Integration Tests

Tests that compile and run real Pascal programs to verify the Pascoal console behaves correctly end-to-end.

## Requirements

- FPC (Free Pascal Compiler) installed and available in `PATH`

## Structure

```
tests/pascal/
  scripts/
    <case_name>/
      <case_name>.pas   # Pascal source
      specs.json        # contract: stdin, expected stdout, exit code
  build/                # compiled artifacts — git-ignored
  pascal_runner.rs      # Rust test runner (place in src-tauri/tests/)
```

## Running

```bash
cargo test --test pascal_runner -- --nocapture
```

## Adding a new test case

1. Create `tests/pascal/scripts/<your_case>/`
2. Add `<your_case>.pas` with your program
3. Add `specs.json`:

```json
{
  "program": "<your_case>.pas",
  "description": "What this tests",
  "stdin": ["line1", "line2"],
  "expect_stdout": [
    "expected line 1",
    "expected line 2"
  ],
  "expect_exit_code": 0
}
```

For a compile error test, add `"expect_compile_failure": true` and leave `stdin`/`expect_stdout` empty.

## specs.json fields

| Field | Type | Description |
|---|---|---|
| `program` | string | Pascal filename inside the case folder |
| `description` | string | Human-readable description |
| `stdin` | string[] | Lines fed to stdin in order |
| `expect_stdout` | string[] | Exact expected stdout lines |
| `expect_exit_code` | int | Expected process exit code (0 = success) |
| `expect_compile_failure` | bool | If true, asserts FPC fails to compile |
