import { describe, it, expect } from 'vitest'
import { locales, type Locale } from '../../../src/i18n'

type Tree = Record<string, unknown>

const REFERENCE: Locale = 'en'
const OTHERS: Locale[] = ['pt-BR', 'es-419', 'pl']

function extractPlaceholders(value: string): string[] {
  const tokens = value.match(/\{(\w+)\}/g) ?? []
  return tokens.map((token) => token.slice(1, -1)).sort()
}

/**
 * Walks both trees together, collecting missing keys, extra keys, and
 * placeholder mismatches for leaf strings shared by both sides.
 */
function comparePaths(
  reference: Tree,
  target: Tree,
  locale: Locale,
  basePath: string,
  errors: string[],
): void {
  const referenceKeys = Object.keys(reference)
  const targetKeys = Object.keys(target)

  for (const key of referenceKeys) {
    const path = basePath ? `${basePath}.${key}` : key
    if (!(key in target)) {
      errors.push(`[${locale}] missing key: "${path}"`)
      continue
    }

    const refValue = reference[key]
    const targetValue = target[key]

    if (typeof refValue === 'string') {
      if (typeof targetValue !== 'string') {
        errors.push(
          `[${locale}] expected a string at "${path}" but found ${typeof targetValue}`,
        )
        continue
      }
      const refTokens = extractPlaceholders(refValue)
      const targetTokens = extractPlaceholders(targetValue)
      if (JSON.stringify(refTokens) !== JSON.stringify(targetTokens)) {
        errors.push(
          `[${locale}] placeholder mismatch at "${path}": en has [${refTokens.join(', ')}], ${locale} has [${targetTokens.join(', ')}]`,
        )
      }
    } else if (typeof refValue === 'object' && refValue !== null) {
      comparePaths(
        refValue as Tree,
        (targetValue ?? {}) as Tree,
        locale,
        path,
        errors,
      )
    }
  }

  for (const key of targetKeys) {
    if (!(key in reference)) {
      const path = basePath ? `${basePath}.${key}` : key
      errors.push(`[${locale}] extra key not present in en: "${path}"`)
    }
  }
}

describe('locale parity', () => {
  const referenceData = locales[REFERENCE] as unknown as Tree

  for (const locale of OTHERS) {
    it(`${locale} has the same keys and placeholders as en`, () => {
      const targetData = locales[locale] as unknown as Tree
      const errors: string[] = []
      comparePaths(referenceData, targetData, locale, '', errors)
      expect(errors).toEqual([])
    })
  }
})
