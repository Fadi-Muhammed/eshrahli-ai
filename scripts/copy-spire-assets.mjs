import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const sourceDir = join(root, 'node_modules', 'spire.presentation')
const targetDir = join(root, 'public', 'vendor', 'spire')

if (!existsSync(sourceDir)) {
  process.exit(0)
}

mkdirSync(targetDir, { recursive: true })

cpSync(join(sourceDir, 'Spire.Presentation.Base.js'), join(targetDir, 'Spire.Presentation.Base.js'))
cpSync(join(sourceDir, 'Spire.Presentation.Base.wasm'), join(targetDir, 'Spire.Presentation.Base.wasm'))
