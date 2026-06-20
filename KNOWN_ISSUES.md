# Known Issues

## Console buffering on Linux
Pascal programs using `write()` (without `writeln`) do not display output
before `readln` on Linux when running via pipes. The stdout buffer is held
by the Pascal runtime and not flushed until the program exits.

**Workaround:** use `writeln` instead of `write` for prompts.  
**To investigate:** `unbuffer` (from `expect` package), Pascal unit injection,
or PTY for program execution on Linux.

---

## Syntax highlighting limitations (CodeMirror legacy-modes)
The Pascal syntax highlighter uses `@codemirror/legacy-modes`, which operates
on a line-by-line regex tokenizer rather than a full syntax tree. This causes
several known inaccuracies:

- `String` is highlighted as a string literal instead of a type name
- `name` (record field) is highlighted as a keyword by the tokenizer
- Built-in types (`Integer`, `Real`, `Boolean`, etc.) and procedures
  (`writeln`, `readln`, etc.) are colored via a `ViewPlugin` regex pass,
  which cannot distinguish context (e.g. a variable named `Integer`)
- Indent guides between `begin/end` blocks are not possible without a
  full syntax tree

**Root cause:** `legacy-modes` does not produce an AST — it tokenizes
line by line, same as editors did before Tree-sitter.

**To investigate:** migrate to a real Tree-sitter parser via
`tree-sitter-pascal` (https://github.com/Isopod/tree-sitter-pascal).
This would require compiling the grammar to WASM and writing a
`highlights.scm` query file for CodeMirror/Lezer. Resolves all
highlighting issues and enables indent guides and code outline.