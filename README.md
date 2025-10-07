# SrcMark

A minimal VS Code extension that automatically adds a top-line comment to each file, showing its path relative to the workspace root (or just the filename in single-file mode).

## Features

- **Automatic Comment**: Prepends a comment with the file path at the top of each file.
- **Auto-Detects Comment Syntax**: Uses the correct comment style for 60+ languages (e.g., `//` for JavaScript, `#` for Python, `--` for SQL, `<!-- -->` for HTML).
- **No Duplicates**: Updates or skips the comment if it’s already present.
- **Glob Filtering**: Only process files matching your chosen pattern.
- **Easy Toggle**: Enable/disable with a command or setting.
- **Undoable**: All edits can be undone.

## Usage

1. Install dependencies:  
   ```sh
   npm install
   ```
2. Open the folder in VS Code.
3. Press `F5` to launch the extension in a new VS Code window.
4. Edit or open files to see the path comment added automatically.

## Commands

- `SrcMark: Toggle On/Off` — Enable or disable automatic comments.
- `SrcMark: Run Now (prepend to active editor)` — Add/update the comment in the current file.

## Settings

You can change these in your VS Code `settings.json`:

- `srcmark.enabled` (default: `true`): Enable/disable the extension.
- `srcmark.autoDetectComment` (default: `true`): Use the right comment style for each language.
- `srcmark.commentPrefix`: Set a fixed comment prefix if auto-detect is off.
- `srcmark.fileGlob` (default: `**/*`): Only process files matching this pattern.
- `srcmark.skipIfPresent` (default: `true`): Don’t add a comment if it’s already there.

## Notes

- Files without comment support (like JSON) are skipped.
- The extension does not auto-save files after editing.
- Works with most popular programming and markup languages.

---