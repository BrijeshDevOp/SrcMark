# SrcMark ![Logo](images/srcmark-banner.png)

A lightweight and intelligent **VS Code extension** that automatically appends a file location comment at the top of any **opened or newly created file**, showing its full path within the project — or just its filename when a single file is opened.

---

## 🚀 Features

- **Smart Path Commenting**: Adds a comment like  
  `// project/src/components/App.js` at the top of each opened file.
- **On-Demand Execution**: Runs **only when files are opened or created**, optimizing memory and performance.
- **Auto Syntax Detection**: Correctly uses comment styles for 60+ languages (`//`, `#`, `<!-- -->`, etc.).
- **Project & Single-File Mode**: Detects whether a workspace or single file is open and adjusts the comment format.
- **Duplicate Prevention**: Automatically detects and skips files already tagged.
- **Folder Ignore Logic**: Ignores common folders like `.git`, `node_modules`, `dist`, and `build`.
- **Universal Compatibility**: Works across all frameworks — React, Django, Spring Boot, Flutter, and more.

---

## ⚙️ How It Works

1. When you **open or create** a file in VS Code, SrcMark automatically:
   - Detects the file’s language and comment syntax.
   - Finds its **relative path** from the workspace root.
   - Inserts a **single-line comment** at the top of the file (only once).
2. Files are processed **only on view**, reducing unnecessary load and memory usage.

---

## 🧩 Installation

```bash
npm install