import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadSidePanelWidth,
  saveSidePanelWidth,
} from '../../../src/editor/sidePanelWidth'

describe('sidePanelWidth', () => {
  beforeEach(() => localStorage.clear())

  it('returns the fallback when nothing is saved', () => {
    expect(loadSidePanelWidth(220)).toBe(220)
  })

  it('returns the saved width rounded to whole pixels', () => {
    saveSidePanelWidth(301.6)
    expect(loadSidePanelWidth(220)).toBe(302)
  })

  it('rounds a fractional saved width to whole pixels', () => {
    localStorage.setItem('pascoal-side-panel-width', '301.6')
    expect(loadSidePanelWidth(220)).toBe(302)
  })

  it.each(['abc', '0', '-50', 'Infinity'])(
    'returns the fallback for an invalid saved value (%s)',
    (value) => {
      localStorage.setItem('pascoal-side-panel-width', value)
      expect(loadSidePanelWidth(220)).toBe(220)
    },
  )
})
