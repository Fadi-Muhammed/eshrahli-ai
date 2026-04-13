# Potential reasons for this PPTX error payload

Given payload:

```json
{
  "courseId": "b25aaf97-bc06-457c-b627-a62151cc0c13",
  "fileName": "L11_ Exceptions.pptx",
  "error": {}
}
```

## Why `error` appears as `{}`

- The thrown value is a native `Error`, and it was serialized with `JSON.stringify(error)`.
- In JavaScript, `Error` fields like `message` and `stack` are non-enumerable by default, so they are dropped in JSON serialization.
- Some code paths may throw non-Error values (`throw {}` or `throw undefined`), which can also end up as an empty object in logs.

## Potential root causes of the PPTX failure

- **Unsupported PPTX content**: embedded media, smart art, uncommon transitions/animations, or corrupted slide objects.
- **Conversion engine limitation**: browser-side WASM converter can fail on specific decks (known in this project docs).
- **File corruption**: the PPTX may open in PowerPoint but still contain broken XML parts that converters reject.
- **Large/complex deck**: memory or timeout issues during conversion.
- **Encrypted/protected file**: password-protected or restricted editing PPTX files are often not convertible.
- **Upload/read issue**: incomplete bytes, truncated file, or MIME/type mismatch in upload pipeline.
- **Backend converter/runtime issue** (if backend path is enabled): missing LibreOffice binary, process crash, timeout, or temp directory permissions.
- **Filename/path edge case**: spaces and special characters can fail in some shell-based conversion implementations if not safely handled.

## Logging improvements to confirm the real cause

- Log a normalized error shape instead of raw `error` object:

```js
const normalizeError = (err) => {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    }
  }

  return {
    message: typeof err === 'string' ? err : 'Unknown error',
    raw: err,
  }
}
```

- Include conversion stage in logs (`upload`, `parse`, `convert`, `pdf-render`, `store`).
- Add file diagnostics: byte size, MIME type, slide count (if available), and whether backend or browser converter was used.
- Capture converter stderr/stdout when using backend LibreOffice.

## Quick triage checklist

- Reproduce with this exact file on both browser and backend converter paths.
- Test with a known-good simple PPTX to isolate environment vs file-specific issue.
- Open and re-save the PPTX in PowerPoint/Google Slides, then retry conversion.
- Verify runtime limits (memory/timeouts) and request size limits.
- Ensure errors are normalized before logging so `message` is always visible.
