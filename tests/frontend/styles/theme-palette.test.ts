import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '../../..')
const globalCss = readFileSync(path.join(ROOT, 'src/styles/global.css'), 'utf-8')
const THEMES_DIR = path.join(ROOT, 'src/styles/themes')
const themeCss = readdirSync(THEMES_DIR)
  .filter((file) => file.endsWith('.css'))
  .map((file) => readFileSync(path.join(THEMES_DIR, file), 'utf-8'))
  .join('\n')

const COLOR_TOKENS = [
  'bg', 'sidebar', 'panel', 'border', 'accent', 'accent2',
  'text', 'text-dim', 'success', 'error',
]

// Merge the `--name: value;` declarations of every theme block whose
// selector list contains `selector`.
function tokens(selector: string): Record<string, string> {
  const result: Record<string, string> = {}
  const css = themeCss.replace(/\/\*[\s\S]*?\*\//g, '')
  for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    if (!selectors.split(',').some((s) => s.trim() === selector)) continue
    for (const [, name, value] of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
      result[name] = value.trim()
    }
  }
  if (Object.keys(result).length === 0) throw new Error(`no block for ${selector}`)
  return result
}

function colors(palette: Record<string, string>): Record<string, string> {
  return Object.fromEntries(COLOR_TOKENS.map((name) => [name, palette[name]]))
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe.each(['dark', 'slate'])('%s theme palette', (theme) => {
  const palette = tokens(`[data-theme="${theme}"]`)

  it('defines every color token as a 6-digit hex', () => {
    // editor-theme.ts appends alpha suffixes (`${panel}99`), which only
    // works on 6-digit hex values.
    for (const name of COLOR_TOKENS) {
      expect(palette[name], name).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })

  it('raises background elevation from editor to sidebar to panel', () => {
    expect(luminance(palette.bg)).toBeLessThan(luminance(palette.sidebar))
    expect(luminance(palette.sidebar)).toBeLessThan(luminance(palette.panel))
    expect(luminance(palette.panel)).toBeLessThan(luminance(palette.border))
  })

  it('keeps text readable on every surface', () => {
    for (const surface of [palette.bg, palette.sidebar, palette.panel]) {
      expect(contrast(palette.text, surface)).toBeGreaterThanOrEqual(7)
      expect(contrast(palette['text-dim'], surface)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('keeps errors distinct from the accent', () => {
    expect(palette.error).not.toBe(palette.accent)
  })

  it('sets its own keyword syntax color', () => {
    expect(palette['syntax-keyword']).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })
})

describe('Dark and Slate stay separate', () => {
  it('keeps Dark+ grays with a rose accent for Dark', () => {
    const dark = tokens('[data-theme="dark"]')
    expect(dark.bg).toBe('#1E1E1E')
    expect(dark.sidebar).toBe('#252526')
    expect(dark.accent).toBe('#B5485F')
  })

  it('keeps :root in sync with Dark for the first paint', () => {
    expect(colors(tokens(':root'))).toEqual(colors(tokens('[data-theme="dark"]')))
  })

  it('keeps optional tokens off :root so they cannot leak into other themes', () => {
    expect(Object.keys(tokens(':root')).sort()).toEqual([...COLOR_TOKENS].sort())
  })

  it('gives Slate its own slate/navy palette', () => {
    expect(colors(tokens('[data-theme="slate"]'))).not.toEqual(
      colors(tokens('[data-theme="dark"]')),
    )
  })
})

describe('other themes stay intact', () => {
  it('has no syntax tokens for Light or Charcoal', () => {
    for (const theme of ['light', 'charcoal']) {
      const names = Object.keys(tokens(`[data-theme="${theme}"]`))
      expect(names.filter((name) => name.startsWith('syntax-'))).toEqual([])
    }
    // Shared defaults that Light and Charcoal still rely on stay unchanged.
    expect(globalCss).toContain('color: var(--syntax-keyword, var(--accent)) !important;')
    expect(globalCss).toContain('color: var(--syntax-number, #E5A84A) !important;')
    expect(globalCss).toContain('color: var(--syntax-function, #61AFEF) !important;')
  })

  it('keeps the Light palette', () => {
    expect(colors(tokens('[data-theme="light"]'))).toEqual({
      bg: '#FFFFFF',
      sidebar: '#F0F0F5',
      panel: '#F7F7FA',
      border: '#E0E0E8',
      accent: '#C1392B',
      accent2: '#2980B9',
      text: '#1A1A2E',
      'text-dim': '#6B6B80',
      success: '#27AE60',
      error: '#C1392B',
    })
  })

  it('keeps the Charcoal palette', () => {
    expect(colors(tokens('[data-theme="charcoal"]'))).toEqual({
      bg: '#141414',
      sidebar: '#1C1C1A',
      panel: '#1F1F1C',
      border: '#2C2820',
      accent: '#CC3322',
      accent2: '#C8901A',
      text: '#E8D8C0',
      'text-dim': '#6A6055',
      success: '#7A9A50',
      error: '#CC3322',
    })
  })
})
