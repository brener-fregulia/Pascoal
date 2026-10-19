import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '../../..')

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf-8')
}

// Pascoal is a desktop app that has to start instantly offline. A remote
// `@import` in the stylesheet is render-blocking: the webview holds the
// first paint until the request resolves or times out, which showed up as
// a multi-second freeze on every launch (Windows and Linux alike). The
// fonts are bundled through @fontsource instead, and the CSP no longer
// allows the Google Fonts hosts - these tests keep both ends in sync.
describe('startup assets stay local', () => {
  const globalCss = read('src/styles/global.css')

  it('global.css imports no remote stylesheet', () => {
    const remoteImports = globalCss.match(
      /@import\s+(url\()?['"]?https?:\/\/[^'")]+/g,
    )
    expect(remoteImports).toBeNull()
  })

  it('global.css bundles the UI and mono fonts locally', () => {
    expect(globalCss).toContain("@import '@fontsource/inter/400.css'")
    expect(globalCss).toContain("@import '@fontsource/jetbrains-mono/400.css'")
  })

  it('declares the bundled font packages as dependencies', () => {
    const pkg = JSON.parse(read('package.json'))
    expect(pkg.dependencies['@fontsource/inter']).toBeTruthy()
    expect(pkg.dependencies['@fontsource/jetbrains-mono']).toBeTruthy()
  })

  it('keeps the CSP free of external font hosts', () => {
    const csp = JSON.parse(read('src-tauri/tauri.conf.json')).app.security.csp
    expect(csp['style-src']).not.toContain('fonts.googleapis.com')
    expect(csp['font-src']).not.toContain('fonts.gstatic.com')
  })
})
