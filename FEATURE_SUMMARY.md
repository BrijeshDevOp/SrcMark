# Auto-Detect Comment Feature

## What was added?

The SrcMark extension now automatically detects the appropriate comment syntax for each file type instead of using a single fixed prefix.

## Changes Made

### 1. New Language Comment Map (`extension.js`)
- Added `LANGUAGE_COMMENT_MAP` with support for 60+ languages
- Maps language IDs to their appropriate comment syntax
- Supports single-line comments (`//`, `#`, `--`, `;`, `%`)
- Supports block comments (`<!-- -->`, `/* */`)
- Handles languages without comment support (e.g., JSON)

### 2. Auto-Detection Functions (`extension.js`)
- **`getCommentPrefix()`**: Detects appropriate comment based on language ID
- **`formatCommentLine()`**: Formats the comment with proper syntax
- Respects user overrides via `commentPrefix` setting

### 3. New Configuration (`package.json`)
- **`srcmark.autoDetectComment`** (default: `true`): Enable/disable auto-detection
- Updated `srcmark.commentPrefix` description to clarify fallback behavior

### 4. Bug Fix
- Fixed operator precedence bug that was inserting only line breaks
- Changed from `commentLine + document.eol === ...` to `commentLine + (document.eol === ...)`

### 5. Documentation (`README.md`)
- Added "Supported Languages" section with examples
- Updated settings descriptions
- Added note about disabling auto-detection

## Usage Examples

**Before (all files used `//`):**
```javascript
// src/app.js
```
```python
// main.py  ← Wrong!
```

**After (automatic detection):**
```javascript
// src/app.js
```
```python
# main.py  ← Correct!
```
```sql
-- queries/users.sql
```
```html
<!-- index.html -->
```

## Configuration

Users can:
1. **Keep auto-detection on** (default) - Works for most cases
2. **Disable auto-detection** - Set `"srcmark.autoDetectComment": false` to use fixed prefix
3. **Override for specific file** - Set custom `commentPrefix` when auto-detect is off
