import { writable } from 'svelte/store'

export type ConsolePosition = 'bottom' | 'right'

export type BuildStatus = 'idle' | 'compiling' | 'success' | 'error'

interface ConsoleState {
  visible: boolean
  running: boolean
  position: ConsolePosition
  docked: boolean
  buildStatus: BuildStatus
  buildOutput: string
  // Exit code of the last finished run; null while none has finished.
  exitCode: number | null
}

function createConsoleStore() {
  const { subscribe, update } = writable<ConsoleState>({
    visible: false,
    running: false,
    position: 'right',
    docked: true,
    buildStatus: 'idle',
    buildOutput: '',
    exitCode: null,
  })

  function setRunning(running: boolean) {
    update((s) => ({ ...s, running }))
  }

  function setBuildStatus(buildStatus: BuildStatus) {
    update((s) => ({ ...s, buildStatus }))
  }

  function setExitCode(exitCode: number | null) {
    update((s) => ({ ...s, exitCode }))
  }

  function appendBuildOutput(text: string) {
    update((s) => ({ ...s, buildOutput: s.buildOutput + text }))
  }

  function resetBuild() {
    update((s) => ({
      ...s,
      buildStatus: 'compiling',
      buildOutput: '',
      exitCode: null,
    }))
  }

  function show() {
    update((s) => ({ ...s, visible: true }))
  }

  function hide() {
    update((s) => ({ ...s, visible: false }))
  }

  function toggle() {
    update((s) => ({ ...s, visible: !s.visible }))
  }

  function setPosition(position: ConsolePosition) {
    update((s) => ({ ...s, position }))
  }

  function setDocked(docked: boolean) {
    update((s) => ({ ...s, docked }))
  }

  function reset() {
    update(() => ({
      visible: false,
      running: false,
      position: 'right',
      docked: true,
      buildStatus: 'idle',
      buildOutput: '',
      exitCode: null,
    }))
  }

  return {
    subscribe,
    setRunning,
    setBuildStatus,
    setExitCode,
    appendBuildOutput,
    resetBuild,
    show,
    hide,
    toggle,
    setPosition,
    setDocked,
    reset,
  }
}

export const consoleStore = createConsoleStore()

// Separate writable to trigger xterm clear — increment to fire
export const clearConsoleSignal = writable(0)
