# SrcMark

Minimal VS Code extension (JavaScript) that prepends a top-line comment with the path relative to the workspace root (or filename in single-file mode).

## Quick start

1. Copy the files into a folder `srcmark`.
2. Run `npm init -y` inside the folder and install `micromatch` if you want the glob support: `npm install micromatch`.
3. Open folder in VS Code and press `F5` to start the Extension Development Host.

## Commands

- `SrcMark: Toggle On/Off` — toggles automatic insertion.
- `SrcMark: Run Now (prepend to active editor)` — immediately process the active editor.

## Settings (in `settings.json`)

- `srcmark.enabled` (boolean): enable/disable at startup. Default `true`.
- `srcmark.autoDetectComment` (boolean): automatically use appropriate comment syntax for each file type (e.g., `#` for Python, `//` for JavaScript, `--` for SQL). Default `true`.
- `srcmark.commentPrefix` (string): comment prefix when auto-detect is disabled or as fallback. Default `//`.
- `srcmark.fileGlob` (string): glob of files to process. Default `**/*`.
- `srcmark.skipIfPresent` (boolean): if true, won't add duplicate identical top-line comment. Default `true`.

## Supported Languages

The extension automatically detects and uses the correct comment syntax for 60+ languages including:
- **C-style (`//`)**: JavaScript, TypeScript, Java, C, C++, C#, Go, Rust, PHP, Swift, Kotlin, Dart, Scala
- **Hash (`#`)**: Python, Ruby, Bash, Shell, PowerShell, YAML, Makefile, Dockerfile, R
- **SQL (`--`)**: SQL, Lua, Haskell
- **Lisp (`;`)**: Clojure, Scheme, Lisp, Racket
- **Markup (`<!-- -->`)**: HTML, XML, Markdown, SVG
- **CSS (`/* */`)**: CSS
- **Other**: Vim (`"`), LaTeX (`%`), Erlang (`%`), and more

Files without comment support (like JSON) are automatically skipped.

## Notes

- The extension edits are undoable. It will not save the file automatically after inserting the comment.
- By default the first workspace folder is used as the root for relative paths.
- You can disable auto-detection and use a fixed comment prefix for all files by setting `srcmark.autoDetectComment` to `false`.
- If a file path comment already exists, it will be **updated** (not duplicated) when the file context changes (e.g., opening as workspace file vs individual file).
- Built-in race condition protection prevents duplicate comments when multiple events fire simultaneously.
