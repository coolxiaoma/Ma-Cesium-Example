import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'node_modules', 'monaco-editor', 'min', 'vs')
const target = join(root, 'public', 'monaco', 'vs')

if (!existsSync(source)) {
  console.warn('[copy-monaco] monaco-editor not found, skip')
  process.exit(0)
}

mkdirSync(dirname(target), { recursive: true })
rmSync(target, { recursive: true, force: true })
cpSync(source, target, { recursive: true })
console.log('[copy-monaco] copied to public/monaco/vs')
