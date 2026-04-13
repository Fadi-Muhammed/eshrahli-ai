const SPIRE_JS_URL = '/vendor/spire/Spire.Presentation.Base.js'

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

export async function convertPptxFileToPdfFile(file) {
  const spire = await ensureSpireRuntime()
  if (!spire?.Presentation || !spire?.Stream || !spire?.FileFormat) {
    throw new Error('PPTX converter is not available in this browser session.')
  }

  const inputBytes = new Uint8Array(await file.arrayBuffer())
  const inputStream = spire.Stream.CreateByBytes(inputBytes)
  const outputStream = spire.Stream.Create()
  const presentation = spire.Presentation.Create()

  try {
    presentation.LoadFromStream(inputStream, spire.FileFormat.Pptx2013)
    presentation.SaveToFile(outputStream, spire.FileFormat.PDF)

    const totalBytes = Number(outputStream.Length)
    outputStream.Position = 0

    const pdfBytes = new Uint8Array(totalBytes)
    outputStream.Read(pdfBytes, 0, totalBytes)

    const baseName = file.name.replace(/\.pptx$/i, '') || 'presentation'
    return new File([pdfBytes], `${baseName}.pdf`, { type: 'application/pdf' })
  } catch (err) {
    throw new Error(err?.message || 'Could not convert this PPTX file to PDF.')
  } finally {
    try { presentation.Dispose?.() } catch {}
    try { outputStream.Dispose?.() } catch {}
    try { inputStream.Dispose?.() } catch {}
  }
}
