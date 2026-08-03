import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const appRoot = join(__dirname, '..', '..')
const stripScript = join(appRoot, 'scripts', 'strip-devpanel.mjs')
const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('strip-devpanel production cleanup', () => {
  it('removes DevPanel files and every compiled page reference', () => {
    const buildDir = mkdtempSync(join(tmpdir(), 'my-opc-build-'))
    tempDirs.push(buildDir)
    mkdirSync(join(buildDir, 'components'), { recursive: true })
    mkdirSync(join(buildDir, 'pages', 'onboarding'), { recursive: true })

    writeFileSync(join(buildDir, 'components', 'DevPanel.js'), 'module.exports = {}')
    writeFileSync(
      join(buildDir, 'pages', 'onboarding', 'index.js'),
      'Math||(s+r+u+n);const n=()=>"../../components/PageShell.js",s=()=>"../../components/PrimaryButton.js",r=()=>"../../components/TextAction.js",u=()=>"../../components/DevPanel.js"',
    )
    writeFileSync(
      join(buildDir, 'pages', 'onboarding', 'index.wxml'),
      '<page-shell></page-shell><dev-panel></dev-panel>',
    )
    writeFileSync(
      join(buildDir, 'pages', 'onboarding', 'index.json'),
      JSON.stringify({ usingComponents: { 'dev-panel': '../../components/DevPanel' } }),
    )

    execFileSync(process.execPath, [stripScript, `--dir=${buildDir}`], { cwd: appRoot })

    expect(existsSync(join(buildDir, 'components', 'DevPanel.js'))).toBe(false)
    expect(readFileSync(join(buildDir, 'pages', 'onboarding', 'index.js'), 'utf8')).not.toMatch(/DevPanel|dev-panel/)
    expect(readFileSync(join(buildDir, 'pages', 'onboarding', 'index.wxml'), 'utf8')).not.toMatch(/DevPanel|dev-panel/)
    expect(readFileSync(join(buildDir, 'pages', 'onboarding', 'index.json'), 'utf8')).not.toMatch(/DevPanel|dev-panel/)
  })
})
