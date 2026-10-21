import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '../../..')
const globalCss = readFileSync(path.join(ROOT, 'src/styles/global.css'), 'utf-8')

// Parse the `--name: value;` declarations of the first block whose selector
// is exactly `selector`.
function tokens(selector: string): Record<string, string> {
  const escaped = selector.replace(/[[\]()"=]/g, '\\$&')
  const block = globalCss.match(new RegExp(`(^|\\n)${escaped}\\s*\\{([^}]*)\\}`))
  if (!block) throw new Error(`no block for ${selector}`)
  const result: Record<string, string> = {}
  for (const [, name, value] of block[2].matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    result[name] = value.trim()
  }
  return result
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

const COLOR_TOKENS = [
  'bg', 'sidebar', 'panel', 'border', 'accent', 'accent2',
  'text', 'text-dim', 'success', 'error',
]

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

  it('overrides keyword syntax color for its own theme', () => {
    expect(globalCss).toMatch(
      new RegExp(`\\[data-theme="${theme}"\\] \\.cm-ts-keyword\\s*\\{`),
    )
  })
})

describe('dracula theme palette', () => {
  const palette = tokens('[data-theme="dracula"]')

  it('defines every color token as a 6-digit hex', () => {
    for (const name of COLOR_TOKENS) {
      expect(palette[name], name).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })

  it('uses the official Dracula editor background and accent', () => {
    expect(palette.bg).toBe('#282A36')
    expect(palette.accent).toBe('#BD93F9')
  })

  it('keeps text readable on every surface', () => {
    for (const surface of [palette.bg, palette.sidebar, palette.panel]) {
      expect(contrast(palette.text, surface)).toBeGreaterThanOrEqual(7)
      expect(contrast(palette['text-dim'], surface)).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe('Dark and Slate stay separate', () => {
  it('follows VS Code Dark+ for Dark', () => {
    const dark = tokens('[data-theme="dark"]')
    expect(dark.bg).toBe('#1E1E1E')
    expect(dark.sidebar).toBe('#252526')
    expect(dark.accent).toBe('#3794FF')
  })

  it('keeps :root in sync with Dark for the first paint', () => {
    const root = tokens(':root')
    const dark = tokens('[data-theme="dark"]')
    for (const name of COLOR_TOKENS) {
      expect(root[name], name).toBe(dark[name])
    }
  })

  it('gives Slate its own slate/navy palette', () => {
    expect(tokens('[data-theme="slate"]')).not.toEqual(
      tokens('[data-theme="dark"]'),
    )
  })
})

describe('other themes stay intact', () => {
  it('has no syntax overrides for Light or Charcoal', () => {
    expect(globalCss).not.toMatch(/\[data-theme="(light|charcoal)"\] \.cm-ts-/)
    // Shared rules that Light and Charcoal still rely on stay unchanged.
    expect(globalCss).toMatch(/\n\.cm-ts-keyword\s*\{\s*color: var\(--accent\) !important;/)
    expect(globalCss).toMatch(/\n\.cm-ts-number\s*\{\s*color: #E5A84A !important;/)
    expect(globalCss).toMatch(/\n\.cm-ts-function\s*\{\s*color: #61AFEF !important;/)
  })

  it('keeps the Light palette', () => {
    expect(tokens('[data-theme="light"]')).toEqual({
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
    expect(tokens('[data-theme="charcoal"]')).toEqual({
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
