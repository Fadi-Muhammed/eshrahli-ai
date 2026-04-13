# PPTX to PDF Backend Converter

Use this when browser conversion fails on some PPTX files.

## Why

- Browser-side WASM conversion may fail for specific decks (`Arg_NullReferenceException`).
- LibreOffice on a backend is usually more reliable for PPTX to PDF.

## Frontend switch

Set this env var in your app:

```bash
VITE_PPTX_CONVERTER_URL=https://your-converter.example.com/convert
```

When this variable is set, the app tries backend conversion first, then falls back to browser conversion.

## Ready service in this repo

There is a ready converter service under `converter/`.

- Code: `converter/server.mjs`
- Docker image recipe: `converter/Dockerfile`
- Usage: `converter/README.md`

## Minimal Node backend (Express + LibreOffice)

```js
import express from 'express'
import multer from 'multer'
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const app = express()
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } })

app.post('/convert', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file is required' })
  if (!req.file.originalname.toLowerCase().endsWith('.pptx')) {
    return res.status(400).json({ error: 'only .pptx is supported' })
  }

  const workDir = await mkdtemp(join(tmpdir(), 'pptx-convert-'))
  const sourcePath = join(workDir, `${randomUUID()}.pptx`)

  try {
    await writeFile(sourcePath, req.file.buffer)

    await execFileAsync('soffice', [
      '--headless',
      '--convert-to',
      'pdf',
      '--outdir',
      workDir,
      sourcePath,
    ])

    const outputPath = sourcePath.replace(/\.pptx$/i, '.pdf')
    const pdfBytes = await readFile(outputPath)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'inline; filename="converted.pdf"')
    res.send(pdfBytes)
  } catch (error) {
    res.status(500).json({ error: error.message || 'conversion failed' })
  } finally {
    await rm(workDir, { recursive: true, force: true })
  }
})

app.listen(3000)
```

## Deploy notes

- This needs LibreOffice installed in runtime.
- Prefer Docker deployment for predictable binary support.
- Keep request size and timeout limits high enough for large decks.
