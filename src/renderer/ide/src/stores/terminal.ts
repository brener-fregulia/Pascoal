import { writable, get } from 'svelte/store'

export type TerminalPosition = 'bottom' | 'right'

export interface TerminalLine {
  id: number
  text: string
  type: 'output' | 'error' | 'info' | 'success'
}

interface TerminalState {
  lines: TerminalLine[]
  running: boolean
  visible: boolean
  position: TerminalPosition
  docked: boolean
}

let lineId = 0

function createTerminalStore() {
  const { subscribe, update, set } = writable<TerminalState>({
    lines: [],
    running: false,
    visible: false,
    position: 'bottom',
    docked: true,
  })

  function addLine(text: string, type: TerminalLine['type'] = 'output') {
    update(s => ({
      ...s,
      lines: [...s.lines, { id: lineId++, text, type }],
    }))
  }

  function clear() {
    update(s => ({ ...s, lines: [] }))
  }

  function setRunning(running: boolean) {
    update(s => ({ ...s, running }))
  }

  function show() {
    update(s => ({ ...s, visible: true }))
  }

  function hide() {
    update(s => ({ ...s, visible: false }))
  }

  function toggle() {
    update(s => ({ ...s, visible: !s.visible }))
  }

  function setPosition(position: TerminalPosition) {
    update(s => ({ ...s, position }))
  }

  function setDocked(docked: boolean) {
    update(s => ({ ...s, docked }))
  }

  return {
    subscribe,
    addLine,
    clear,
    setRunning,
    show,
    hide,
    toggle,
    setPosition,
    setDocked,
  }
}

export const terminalStore = createTerminalStore()
