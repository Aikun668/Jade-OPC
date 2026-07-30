import { existsSync, readFileSync, writeFileSync, unlinkSync, readdirSync } from 'fs'
import { join, dirname, extname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const dirArg = process.argv.find(a => a.startsWith('--dir='))
const BUILD_DIR = dirArg
  ? dirArg.slice('--dir='.length)
  : join(__dirname, '..', 'dist', 'build', 'mp-weixin')

const componentsDir = join(BUILD_DIR, 'components')

// 1. Remove DevPanel component files
const devPanelPrefixes = ['DevPanel']
for (const prefix of devPanelPrefixes) {
  if (existsSync(componentsDir)) {
    for (const file of readdirSync(componentsDir)) {
      if (file.startsWith(prefix)) {
        const fullPath = join(componentsDir, file)
        unlinkSync(fullPath)
        console.log(`[strip-devpanel] Removed ${file}`)
      }
    }
  }
}

// 2. Remove dev-panel from usingComponents in pages/**/*.json
function walkDir(dir) {
  if (!existsSync(dir)) return []
  const result = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      result.push(...walkDir(full))
    } else if (entry.name.endsWith('.json')) {
      result.push(full)
    }
  }
  return result
}

for (const jsonPath of walkDir(join(BUILD_DIR, 'pages'))) {
  const content = readFileSync(jsonPath, 'utf-8')
  const json = JSON.parse(content)
  if (json.usingComponents && json.usingComponents['dev-panel']) {
    delete json.usingComponents['dev-panel']
    if (Object.keys(json.usingComponents).length === 0) {
      delete json.usingComponents
    }
    writeFileSync(jsonPath, JSON.stringify(json, null, 2) + '\n')
    console.log(`[strip-devpanel] Cleaned ${jsonPath.replace(BUILD_DIR, '')}`)
  }
}

console.log('[strip-devpanel] Done')
