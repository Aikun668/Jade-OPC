import { describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync, mkdtempSync } from 'node:fs'
import { resolve } from 'node:path'
import { tmpdir } from 'node:os'

const NODE = process.execPath
const SCRIPT = resolve(__dirname, '../../scripts/check-wxss-compat.mjs')

function runChecker(dir: string): { exitCode: number; stdout: string; stderr: string } {
  try {
    const stdout = execSync(`"${NODE}" "${SCRIPT}" --dir="${dir}"`, {
      encoding: 'utf-8',
      timeout: 10000,
    })
    return { exitCode: 0, stdout, stderr: '' }
  } catch (e: any) {
    return {
      exitCode: e.status ?? 1,
      stdout: e.stdout?.toString() ?? '',
      stderr: e.stderr?.toString() ?? '',
    }
  }
}

function setupTemp(dirName: string): string {
  const dir = mkdtempSync(resolve(tmpdir(), dirName))
  mkdirSync(resolve(dir, 'components'), { recursive: true })
  mkdirSync(resolve(dir, 'pages', 'test'), { recursive: true })
  return dir
}

describe('check-wxss-compat', () => {
  // ---- Clean component WXSS passes ----
  it('passes when component WXSS only contains class selectors', () => {
    const dir = setupTemp('wxss-clean-')
    writeFileSync(resolve(dir, 'components', 'Test.wxss'), '.my-class { color: red; }\n.another-class { }')
    writeFileSync(resolve(dir, 'pages', 'test', 'index.wxss'), 'page { color: red; }')

    const result = runChecker(dir)
    expect(result.exitCode).toBe(0)
    rmSync(dir, { recursive: true })
  })

  // ---- Tag selector in component fails ----
  it('fails when component WXSS contains page.data-v tag selector', () => {
    const dir = setupTemp('wxss-tag-')
    writeFileSync(resolve(dir, 'components', 'Test.wxss'), 'page.data-v-test { font-family: sans-serif; }')

    const result = runChecker(dir)
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('tag selector')
    rmSync(dir, { recursive: true })
  })

  it('fails when component WXSS contains bare view tag selector', () => {
    const dir = setupTemp('wxss-view-')
    writeFileSync(resolve(dir, 'components', 'Test.wxss'), 'view { display: block; }')

    const result = runChecker(dir)
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('tag selector')
    rmSync(dir, { recursive: true })
  })

  // ---- ID selector in component fails ----
  it('fails when component WXSS contains #root ID selector', () => {
    const dir = setupTemp('wxss-id-')
    writeFileSync(resolve(dir, 'components', 'Test.wxss'), '#root { color: red; }')

    const result = runChecker(dir)
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('ID selector')
    rmSync(dir, { recursive: true })
  })

  // ---- Attribute selector in component fails ----
  it('fails when component WXSS contains [data-state] attribute selector', () => {
    const dir = setupTemp('wxss-attr-')
    writeFileSync(resolve(dir, 'components', 'Test.wxss'), '[data-state] { color: red; }')

    const result = runChecker(dir)
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('attribute selector')
    rmSync(dir, { recursive: true })
  })

  // ---- Page-level WXSS can have tag selectors ----
  it('allows tag selectors in page-level WXSS (not component)', () => {
    const dir = setupTemp('wxss-page-')
    writeFileSync(resolve(dir, 'pages', 'test', 'index.wxss'), 'page { color: red; }\nview { }')
    writeFileSync(resolve(dir, 'components', 'Safe.wxss'), '.safe-class { }')

    const result = runChecker(dir)
    expect(result.exitCode).toBe(0)
    rmSync(dir, { recursive: true })
  })

  // ---- Universal * and :root still caught ----
  it('fails on universal * selector even in page WXSS', () => {
    const dir = setupTemp('wxss-all-')
    writeFileSync(resolve(dir, 'pages', 'test', 'index.wxss'), 'view * { }')

    const result = runChecker(dir)
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('universal selector')
    rmSync(dir, { recursive: true })
  })

  it('fails on :root in any WXSS', () => {
    const dir = setupTemp('wxss-root-')
    writeFileSync(resolve(dir, 'pages', 'test', 'index.wxss'), ':root { --x: 0; }')

    const result = runChecker(dir)
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain(':root')
    rmSync(dir, { recursive: true })
  })

  // ---- Empty dir fails ----
  it('exits with code 1 if no .wxss files found', () => {
    const dir = mkdtempSync(resolve(tmpdir(), 'wxss-empty-'))

    const result = runChecker(dir)
    expect(result.exitCode).toBe(1)
    rmSync(dir, { recursive: true })
  })

  // ---- BEM class containing tag name substring doesn't false-positive ----
  it('does not flag tag name substrings inside class names', () => {
    const dir = setupTemp('wxss-bem-')
    writeFileSync(resolve(dir, 'components', 'Test.wxss'), '.page-shell { color: red; }\n.text-muted { }\n.image-thumb { }')

    const result = runChecker(dir)
    expect(result.exitCode).toBe(0)
    rmSync(dir, { recursive: true })
  })
})
