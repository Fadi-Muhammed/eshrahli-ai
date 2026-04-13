import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const sourceDir = join(root, 'node_modules', 'spire.presentation')
const targetDir = join(root, 'public', 'vendor', 'spire')
const dejavuDir = join(root, 'node_modules', 'dejavu-fonts-ttf', 'ttf')
const vazirDir = join(root, 'node_modules', 'vazirmatn', 'fonts', 'ttf')
const fontsTargetDir = join(root, 'public', 'vendor', 'fonts')

if (!existsSync(sourceDir)) {
  process.exit(0)
}

mkdirSync(targetDir, { recursive: true })

cpSync(join(sourceDir, 'Spire.Presentation.Base.js'), join(targetDir, 'Spire.Presentation.Base.js'))
cpSync(join(sourceDir, 'Spire.Presentation.Base.wasm'), join(targetDir, 'Spire.Presentation.Base.wasm'))

if (existsSync(dejavuDir)) {
  mkdirSync(fontsTargetDir, { recursive: true })
  cpSync(join(dejavuDir, 'DejaVuSans.ttf'), join(fontsTargetDir, 'DejaVuSans.ttf'))
  cpSync(join(dejavuDir, 'DejaVuSans-Bold.ttf'), join(fontsTargetDir, 'DejaVuSans-Bold.ttf'))
  cpSync(join(dejavuDir, 'DejaVuSerif.ttf'), join(fontsTargetDir, 'DejaVuSerif.ttf'))

  cpSync(join(dejavuDir, 'DejaVuSans.ttf'), join(fontsTargetDir, 'ARIALUNI.TTF'))
}

if (existsSync(vazirDir)) {
  mkdirSync(fontsTargetDir, { recursive: true })
  cpSync(join(vazirDir, 'Vazirmatn-Regular.ttf'), join(fontsTargetDir, 'Vazirmatn-Regular.ttf'))
  cpSync(join(vazirDir, 'Vazirmatn-Bold.ttf'), join(fontsTargetDir, 'Vazirmatn-Bold.ttf'))

  cpSync(join(vazirDir, 'Vazirmatn-Regular.ttf'), join(fontsTargetDir, 'Tahoma.ttf'))
  cpSync(join(vazirDir, 'Vazirmatn-Bold.ttf'), join(fontsTargetDir, 'Tahoma Bold.ttf'))
}
