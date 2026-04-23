import ConvertApi from 'convertapi-js'

const convertApi = ConvertApi.auth('o3pIcmQR4iOTvPEwozegOysHYmXugjSp')

export async function convertPptxFileToPdfFile(file) {
  console.info('[PPTX→PDF] Starting conversion via ConvertAPI', {
    fileName: file?.name,
    fileSize: file?.size,
  })

  const params = convertApi.createParams()
  params.add('File', file)

  const result = await convertApi.convert('pptx', 'pdf', params)
  const outputUrl = result?.files?.[0]?.Url
  if (!outputUrl) throw new Error('ConvertAPI returned no output file URL')

  const response = await fetch(outputUrl)
  if (!response.ok) throw new Error(`ConvertAPI download failed (${response.status})`)

  const blob = await response.blob()
  if (!blob || blob.size === 0) throw new Error('ConvertAPI returned an empty PDF')

  const baseName = file.name.replace(/\.pptx$/i, '') || 'presentation'
  const pdfFile = new File([blob], `${baseName}.pdf`, { type: 'application/pdf' })

  console.info('[PPTX→PDF] Done', { outputSize: pdfFile.size })
  return pdfFile
}
