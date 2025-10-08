const vscode = require("vscode");
const path = require("path");

/**
 * Map of language IDs to their comment syntax.
 * Returns an object with 'prefix' for single-line comments or 'start'/'end' for block comments.
 */
const LANGUAGE_COMMENT_MAP = {
  // C-style comments
  javascript: { prefix: "//" },
  javascriptreact: { prefix: "//" },
  typescript: { prefix: "//" },
  typescriptreact: { prefix: "//" },
  java: { prefix: "//" },
  c: { prefix: "//" },
  cpp: { prefix: "//" },
  csharp: { prefix: "//" },
  go: { prefix: "//" },
  swift: { prefix: "//" },
  kotlin: { prefix: "//" },
  rust: { prefix: "//" },
  php: { prefix: "//" },
  dart: { prefix: "//" },
  scala: { prefix: "//" },
  groovy: { prefix: "//" },
  "objective-c": { prefix: "//" },
  "objective-cpp": { prefix: "//" },

  // Hash/Pound comments
  python: { prefix: "#" },
  ruby: { prefix: "#" },
  perl: { prefix: "#" },
  shell: { prefix: "#" },
  bash: { prefix: "#" },
  sh: { prefix: "#" },
  zsh: { prefix: "#" },
  fish: { prefix: "#" },
  powershell: { prefix: "#" },
  yaml: { prefix: "#" },
  toml: { prefix: "#" },
  makefile: { prefix: "#" },
  cmake: { prefix: "#" },
  dockerfile: { prefix: "#" },
  nginx: { prefix: "#" },
  coffee: { prefix: "#" },
  r: { prefix: "#" },

  // SQL-style comments
  sql: { prefix: "--" },
  lua: { prefix: "--" },
  haskell: { prefix: "--" },
  elm: { prefix: "--" },
  purescript: { prefix: "--" },

  // Lisp-style comments
  clojure: { prefix: ";" },
  lisp: { prefix: ";" },
  scheme: { prefix: ";" },
  racket: { prefix: ";" },

  // Percent comments
  erlang: { prefix: "%" },
  prolog: { prefix: "%" },
  latex: { prefix: "%" },
  bibtex: { prefix: "%" },
  matlab: { prefix: "%" },

  // Markup languages
  html: { prefix: "<!--", suffix: "-->" },
  xml: { prefix: "<!--", suffix: "-->" },
  markdown: { prefix: "<!--", suffix: "-->" },
  svg: { prefix: "<!--", suffix: "-->" },

  // CSS-style comments
  css: { prefix: "/*", suffix: "*/" },
  less: { prefix: "//" },
  scss: { prefix: "//" },
  sass: { prefix: "//" },
  stylus: { prefix: "//" },

  // Other
  vim: { prefix: '"' },
  ini: { prefix: ";" },
  properties: { prefix: "#" },
  gitignore: { prefix: "#" },
  editorconfig: { prefix: "#" },
  graphql: { prefix: "#" },
  json: { prefix: null }, // JSON doesn't support comments
  jsonc: { prefix: "//" },
  json5: { prefix: "//" },
};

/**
 * Detect the appropriate comment prefix for a given document.
 * Falls back to user config or '//' if no mapping exists.
 */
function getCommentPrefix(document, config) {
  const autoDetect = config.get("autoDetectComment", true);
  const userPrefix = config.get("commentPrefix", null);

  // If user explicitly set a prefix, use it (unless it's the default and autoDetect is on)
  if (userPrefix && (!autoDetect || userPrefix !== "//")) {
    return { prefix: userPrefix };
  }

  // Auto-detect based on language ID
  if (autoDetect) {
    const langId = document.languageId;
    if (LANGUAGE_COMMENT_MAP[langId]) {
      return LANGUAGE_COMMENT_MAP[langId];
    }
  }

  // Fallback to default
  return { prefix: userPrefix || "//" };
}

/**
 * Format a comment line with the given prefix/suffix and label.
 */
function formatCommentLine(commentStyle, label) {
  if (commentStyle.suffix) {
    // For languages with explicit closing syntax (HTML, CSS, etc.)
    return `${commentStyle.prefix} ${label} ${commentStyle.suffix}`;
  } else if (commentStyle.prefix) {
    // For languages with single-line comment prefix
    return `${commentStyle.prefix} ${label}`;
  } else {
    // For languages without comment support (like JSON)
    return null;
  }
}

/**
 * Compute the relative path from the workspace root (first folder) to the document.
 * If no workspace folder or file is outside workspace, returns basename of the file.
 */
function computeLabel(document) {
  const wf = vscode.workspace.workspaceFolders;
  const docUri = document.uri;

  // For untitled editors (new unsaved files), use the fileName if available, otherwise 'untitled'
  if (docUri.scheme === "untitled") {
    return path.basename(document.fileName || "untitled");
  }

  if (wf && wf.length > 0) {
    // Use the first workspace folder as the root (as requested)
    const root = wf[0].uri.fsPath;
    const workspaceName = path.basename(root);

    try {
      let rel = path.relative(root, docUri.fsPath);
      // Normalize to forward slashes for display
      rel = rel.split(path.sep).join("/");

      // If path is empty or starts with '..' (file is outside workspace), use basename only
      if (!rel || rel === "" || rel.startsWith("..")) {
        return path.basename(docUri.fsPath);
      }

      // Include workspace folder name in the path
      return `${workspaceName}/${rel}`;
    } catch {
      // fallback to basename
      return path.basename(docUri.fsPath);
    }
  } else {
    // Single-file mode: return basename only
    return path.basename(docUri.fsPath);
  }
}

/**
 * Check if a line looks like a srcmark comment (contains a file path-like string).
 * This helps detect existing srcmark comments even if the path has changed.
 */
function isLikelySrcMarkComment(line, commentStyle) {
  if (!commentStyle.prefix) return false;

  const trimmedLine = line.trim();

  // Check if line starts with the comment prefix
  if (!trimmedLine.startsWith(commentStyle.prefix.trim())) return false;

  // Extract the content after the comment prefix
  let content = trimmedLine.substring(commentStyle.prefix.trim().length).trim();

  // If there's a suffix (like --> for HTML), remove it
  if (commentStyle.suffix) {
    const suffixTrimmed = commentStyle.suffix.trim();
    if (content.endsWith(suffixTrimmed)) {
      content = content
        .substring(0, content.length - suffixTrimmed.length)
        .trim();
    }
  }

  // Check if content looks like a file path:
  // - Contains file extension (.js, .py, etc.) OR
  // - Contains path separators (/ or \) OR
  // - Looks like a filename without spaces
  const hasExtension = /\.\w{1,8}$/.test(content);
  const hasPathSeparator = content.includes("/") || content.includes("\\");
  const looksLikeFilename =
    /^[\w\-\.\/\\]+$/.test(content) && content.length > 0;

  return hasExtension || hasPathSeparator || looksLikeFilename;
}

/**
 * Insert top-line comment if missing (idempotent if skipIfPresent true).
 * Updates existing srcmark comments if the path has changed.
 */
async function ensureTopComment(document, context) {
  const config = vscode.workspace.getConfiguration("srcmark");
  const enabledInConfig = config.get("enabled", true);
  if (!enabledInConfig) return;

  const enabledState = context.globalState.get("srcmark.enabled", true);
  if (!enabledState) return;

  // Only text documents
  if (document.isClosed) return;
  if (document.languageId === "binary") return;

  // Apply fileGlob filter
  const fileGlob = config.get("fileGlob", "**/*");
  const micromatch = require("micromatch");
  const filePathForGlob = document.uri.fsPath || document.fileName || "";
  if (!micromatch.isMatch(filePathForGlob, fileGlob)) return;

  const label = computeLabel(document);
  const commentStyle = getCommentPrefix(document, config);
  const commentLine = formatCommentLine(commentStyle, label);

  // Skip if no comment syntax is available (e.g., JSON)
  if (commentLine === null) return;

  const skipIfPresent = config.get("skipIfPresent", true);

  // Read first line
  const firstLine = document.lineAt(0).text;

  // Check if the exact comment is already present
  if (skipIfPresent && firstLine.trim() === commentLine.trim()) {
    // already present — nothing to do
    return;
  }

  const edit = new vscode.WorkspaceEdit();

  // Check if first line is an existing srcmark comment that needs updating
  if (isLikelySrcMarkComment(firstLine, commentStyle)) {
    // Replace the existing comment instead of inserting a new one
    const firstLineRange = document.lineAt(0).range;
    edit.replace(document.uri, firstLineRange, commentLine);
  } else {
    // Insert new comment at the top
    const insertPos = new vscode.Position(0, 0);
    edit.insert(
      document.uri,
      insertPos,
      commentLine + (document.eol === vscode.EndOfLine.LF ? "\n" : "\r\n")
    );
  }

  await vscode.workspace.applyEdit(edit);
  // Save? We don't save automatically — leave it to user's workflow. The edit is undoable.
}

/**
 * Activate the extension
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  const output = vscode.window.createOutputChannel("SrcMark");
  context.subscriptions.push(output);
  output.appendLine("SrcMark activated");

  // Track files currently being processed to prevent race conditions
  const processingFiles = new Set();

  async function safeEnsureTopComment(document) {
    const fileKey = document.uri.toString();
    if (processingFiles.has(fileKey)) return;
    try {
      processingFiles.add(fileKey);
      await ensureTopComment(document, context);
    } finally {
      // small debounce so subsequent rapid events don't requeue immediately
      setTimeout(() => processingFiles.delete(fileKey), 100);
    }
  }

  // Status bar
  const status = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  function updateStatus() {
    const enabledState = context.globalState.get("srcmark.enabled", true);
    status.text = `SrcMark: ${enabledState ? "ON" : "OFF"}`;
    status.show();
  }
  updateStatus();
  context.subscriptions.push(status);

  // Toggle command
  const toggleCmd = vscode.commands.registerCommand("srcmark.toggle", () => {
    const cur = context.globalState.get("srcmark.enabled", true);
    context.globalState.update("srcmark.enabled", !cur).then(() => {
      updateStatus();
      vscode.window.showInformationMessage(
        `SrcMark is now ${!cur ? "enabled" : "disabled"}`
      );
    });
  });
  context.subscriptions.push(toggleCmd);

  // Run now command (on active editor)
  const runNow = vscode.commands.registerCommand("srcmark.runNow", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage("SrcMark: No active text editor");
      return;
    }
    await safeEnsureTopComment(editor.document);
    vscode.window.showInformationMessage("SrcMark: processed active file");
  });
  context.subscriptions.push(runNow);

  // --- IMPORTANT CHANGE: only process files the user actually views ---
  // When an editor becomes active (user switches to / opens a tab they see)
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(async (editor) => {
      if (!editor) return;
      try {
        // Only process if config allows this mode (default true)
        const config = vscode.workspace.getConfiguration("srcmark");
        const processOnlyOnView = config.get("processOnlyOnView", true);
        if (!processOnlyOnView) {
          // If user disabled "processOnlyOnView", preserve old behavior by also processing
          await safeEnsureTopComment(editor.document);
          return;
        }
        // Normal desired behavior: process only when the file becomes active / viewed
        await safeEnsureTopComment(editor.document);
      } catch (e) {
        output.appendLine("Error in onDidChangeActiveTextEditor: " + String(e));
      }
    })
  );

  // Handle files created via API / VS Code new file UI
  if (vscode.workspace.onDidCreateFiles) {
    context.subscriptions.push(
      vscode.workspace.onDidCreateFiles(async (event) => {
        try {
          // event.files is an array of URIs
          for (const uri of event.files) {
            // try to find if the file is currently opened in an editor
            const editors = vscode.window.visibleTextEditors;
            const editorForUri = editors.find(
              (ed) =>
                ed.document && ed.document.uri.toString() === uri.toString()
            );
            // If it's visible, process; otherwise, we skip (user didn't open it yet)
            if (editorForUri) {
              await safeEnsureTopComment(editorForUri.document);
            }
          }
        } catch (e) {
          output.appendLine("Error in onDidCreateFiles: " + String(e));
        }
      })
    );
  }

  // Keep save-based processing (in case user creates file and saves without focusing)
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      try {
        // Only process saves if the document is visible (to avoid background workspace saves)
        const isVisible = vscode.window.visibleTextEditors.some(
          (ed) =>
            ed.document &&
            ed.document.uri.toString() === document.uri.toString()
        );
        if (isVisible) {
          await safeEnsureTopComment(document);
        }
      } catch (e) {
        output.appendLine("Error in onDidSaveTextDocument: " + String(e));
      }
    })
  );

  // IMPORTANT: do NOT run a bulk pass on activation. Only process the currently active editor (if any)
  // if the user wants that behavior they can run "srcmark.runNow".
  if (vscode.window.activeTextEditor) {
    // Process just the currently visible active editor (not every doc opened in background)
    // This preserves existing behavior for the active tab on activation while avoiding bulk processing.
    safeEnsureTopComment(vscode.window.activeTextEditor.document).catch((e) =>
      output.appendLine(String(e))
    );
  }
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
