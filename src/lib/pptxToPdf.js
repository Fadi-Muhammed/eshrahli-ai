const SPIRE_JS_URL = '/vendor/spire/Spire.Presentation.Base.js'
const BACKEND_CONVERTER_URL = import.meta.env.VITE_PPTX_CONVERTER_URL
const VFS_FONT_DIR = '/Library/Fonts/'
const PUBLIC_FONTS_BASE = '/vendor/fonts/'
const FONT_FILES = [
  'ARIALUNI.TTF',
  'DejaVuSans.ttf',
  'DejaVuSans-Bold.ttf',
  'DejaVuSerif.ttf',
  'Vazirmatn-Regular.ttf',
  'Vazirmatn-Bold.ttf',
  'Tahoma.ttf',
  'Tahoma Bold.ttf',
]

let runtimePromise

function ensureSpireRuntime() {
  if (runtimePromise) return runtimePromise

  runtimePromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-spire-runtime="true"]`)
    if (existing && window.spirepresentation) {
      resolve(window.spirepresentation)
      return
    }

    const previousInit = window.Module?.onRuntimeInitialized
    window.Module = {
      ...(window.Module ?? {}),
      onRuntimeInitialized: () => {
        try {
          previousInit?.()
        } catch {
          // Ignore prior handler errors so conversion can continue.
        }
        resolve(window.spirepresentation)
      },
    }

    if (existing) {
      return
    }

    const script = document.createElement('script')
    script.src = SPIRE_JS_URL
    script.async = true
    script.dataset.spireRuntime = 'true'
    script.onerror = () => reject(new Error('Failed to load PPTX converter runtime.'))
    document.body.appendChild(script)
  })

  return runtimePromise
}

let fontsPromise
let hasLoggedBackendConfigHint = false

async function convertPptxViaBackend(file) {
  if (!BACKEND_CONVERTER_URL) return null

  console.info('[PPTX->PDF] Trying backend converter', {
    endpoint: BACKEND_CONVERTER_URL,
    fileName: file?.name,
    fileSize: file?.size,
  })

  const formData = new FormData()
  formData.append('file', file, file.name)

  let response
  try {
    response = await fetch(BACKEND_CONVERTER_URL, {
      method: 'POST',
      body: formData,
    })
  } catch (error) {
    const message = String(error?.message || '').toLowerCase()
    const isNetworkFailure =
      message.includes('failed to fetch') ||
      message.includes('networkerror') ||
      message.includes('connection refused')

    if (isNetworkFailure) {
      throw new Error(
        'PPTX converter service is not reachable. Start the app with `npm run dev` and retry.'
      )
    }

    throw error
  }

  if (!response.ok) {
    let message = `Backend converter failed (${response.status})`
    try {
      const body = await response.json()
      message = body?.error || body?.message || message
    } catch (jsonError) {
      void jsonError
      const text = await response.text().catch(() => '')
      if (text) message = text
    }
    console.error('[PPTX->PDF] Backend converter failed', {
      status: response.status,
      message,
    })
    throw new Error(message)
  }

  const blob = await response.blob()
  if (!blob || blob.size === 0) {
    throw new Error('Backend converter returned an empty PDF file.')
  }

  const baseName = file.name.replace(/\.pptx$/i, '') || 'presentation'
  return new File([blob], `${baseName}.pdf`, { type: 'application/pdf' })
}

async function ensureFontsLoaded(spire) {
  if (fontsPromise) return fontsPromise

  fontsPromise = Promise.allSettled(
    FONT_FILES.map((fontFile) => spire.FetchFileToVFS(fontFile, VFS_FONT_DIR, PUBLIC_FONTS_BASE))
  ).then(() => {
    try { spire.Presentation.SetCustomFontsDirctory(VFS_FONT_DIR) } catch (error) { void error }
    try { spire.Presentation.SetDefaultFontName('Tahoma') } catch (error) { void error }
    try { spire.Presentation.SetDefaultFontName('Vazirmatn') } catch (error) { void error }
    try { spire.Presentation.SetDefaultFontName('Arial Unicode MS') } catch (error) { void error }
  }).catch((error) => {
    fontsPromise = undefined
    throw error
  })

  return fontsPromise
}

export async function convertPptxFileToPdfFile(file) {
  if (BACKEND_CONVERTER_URL) {
    const backendPdf = await convertPptxViaBackend(file)
    if (backendPdf) {
      console.info('[PPTX->PDF] Backend converter succeeded', {
        outputSize: backendPdf.size,
      })
      return backendPdf
    }
  } else if (!hasLoggedBackendConfigHint) {
    hasLoggedBackendConfigHint = true
    console.warn('[PPTX->PDF] No backend converter configured. Set VITE_PPTX_CONVERTER_URL to avoid browser-engine conversion failures on some decks.')
  }

  const spire = await ensureSpireRuntime()
  if (!spire?.Presentation || !spire?.Stream || !spire?.FileFormat) {
    throw new Error('PPTX converter is not available in this browser session.')
  }

  await ensureFontsLoaded(spire)
  console.info('[PPTX->PDF] Browser converter started', {
    fileName: file?.name,
    fileSize: file?.size,
  })

  const inputBytes = new Uint8Array(await file.arrayBuffer())
  const loadFormats = [
    undefined,
    spire.FileFormat.Auto,
  ]

  let lastError
  for (const loadFormat of loadFormats) {
    const presentation = spire.Presentation.Create()
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const pptxVfsPath = `/${id}.pptx`
    const pdfVfsPath = `/${id}.pdf`

    try {
      if (typeof spire.PrepareFile === 'function') {
        spire.PrepareFile(inputBytes, pptxVfsPath)
      } else {
        spire.FS.writeFile(pptxVfsPath, inputBytes, { flags: 'w+' })
      }

      if (loadFormat) {
        try { presentation.SetCustomFontsFolder(VFS_FONT_DIR) } catch (error) { void error }
        presentation.LoadFromFile(pptxVfsPath, loadFormat)
      } else {
        try { presentation.SetCustomFontsFolder(VFS_FONT_DIR) } catch (error) { void error }
        presentation.LoadFromFile(pptxVfsPath)
      }

      presentation.SaveToFile(pdfVfsPath, spire.FileFormat.PDF)

      if (!spire.FS?.analyzePath(pdfVfsPath)?.exists) {
        throw new Error('Converted PDF file was not created.')
      }

      const pdfBytes = spire.FS.readFile(pdfVfsPath, { encoding: 'binary' })
      const baseName = file.name.replace(/\.pptx$/i, '') || 'presentation'
      console.info('[PPTX->PDF] Browser converter succeeded', {
        loadFormat: loadFormat?.name ?? 'default',
        outputBytes: pdfBytes?.length,
      })
      return new File([pdfBytes], `${baseName}.pdf`, { type: 'application/pdf' })
    } catch (err) {
      console.warn('[PPTX->PDF] Browser converter attempt failed', {
        loadFormat: loadFormat?.name ?? 'default',
        error: err,
      })
      lastError = err
    } finally {
      try { if (spire.FS?.analyzePath(pptxVfsPath)?.exists) spire.FS.unlink(pptxVfsPath) } catch (disposeError) { void disposeError }
      try { if (spire.FS?.analyzePath(pdfVfsPath)?.exists) spire.FS.unlink(pdfVfsPath) } catch (disposeError) { void disposeError }
      try { presentation.Dispose?.() } catch (disposeError) { void disposeError }
    }
  }

  const message = lastError?.message || 'Could not convert this PPTX file to PDF.'
  console.error('[PPTX->PDF] Conversion failed', {
    fileName: file?.name,
    message,
    rawError: lastError,
  })
  if (/Arg_NullReferenceException/i.test(message)) {
    throw new Error('This PPTX cannot be converted reliably in the browser engine. Please export it as PDF and upload the PDF file for this deck.')
  }
  throw new Error(message)
}
