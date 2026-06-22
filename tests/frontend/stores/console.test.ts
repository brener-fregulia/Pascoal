import { describe, it, expect, beforeEach } from 'vitest'
import { get } from 'svelte/store'
import { consoleStore, clearConsoleSignal, type BuildStatus, type ConsolePosition } from '../../../src/renderer/ide/src/stores/console'

interface ConsoleState {
  visible: boolean
  running: boolean
  position: ConsolePosition
  docked: boolean
  buildStatus: BuildStatus
  buildOutput: string
}

function state(): ConsoleState {
  return get(consoleStore) as ConsoleState
}

describe('consoleStore', () => {
  beforeEach(() => {
    consoleStore.reset()
    clearConsoleSignal.set(0)
  })

  describe('initial state', () => {
    it('is hidden by default', () => {
      expect(state().visible).toBe(false)
    })

    it('is not running by default', () => {
      expect(state().running).toBe(false)
    })

    it('defaults to right position', () => {
      expect(state().position).toBe('right')
    })

    it('build status starts as idle', () => {
      expect(state().buildStatus).toBe('idle')
    })

    it('build output starts empty', () => {
      expect(state().buildOutput).toBe('')
    })
  })

  describe('visibility', () => {
    it('show makes console visible', () => {
      consoleStore.show()
      expect(state().visible).toBe(true)
    })

    it('hide makes console invisible', () => {
      consoleStore.show()
      consoleStore.hide()
      expect(state().visible).toBe(false)
    })

    it('toggle flips visibility', () => {
      consoleStore.toggle()
      expect(state().visible).toBe(true)
      consoleStore.toggle()
      expect(state().visible).toBe(false)
    })
  })

  describe('running state', () => {
    it('setRunning true marks as running', () => {
      consoleStore.setRunning(true)
      expect(state().running).toBe(true)
    })

    it('setRunning false marks as not running', () => {
      consoleStore.setRunning(true)
      consoleStore.setRunning(false)
      expect(state().running).toBe(false)
    })
  })

  describe('build status', () => {
    it('resetBuild sets status to compiling and clears output', () => {
      consoleStore.appendBuildOutput('some previous output')
      consoleStore.resetBuild()
      expect(state().buildStatus).toBe('compiling')
      expect(state().buildOutput).toBe('')
    })

    it('setBuildStatus transitions to success', () => {
      consoleStore.resetBuild()
      consoleStore.setBuildStatus('success')
      expect(state().buildStatus).toBe('success')
    })

    it('setBuildStatus transitions to error', () => {
      consoleStore.resetBuild()
      consoleStore.setBuildStatus('error')
      expect(state().buildStatus).toBe('error')
    })

    it('setBuildStatus transitions to idle', () => {
      consoleStore.setBuildStatus('success')
      consoleStore.setBuildStatus('idle')
      expect(state().buildStatus).toBe('idle')
    })
  })

  describe('build output', () => {
    it('appendBuildOutput accumulates text', () => {
      consoleStore.resetBuild()
      consoleStore.appendBuildOutput('line one\n')
      consoleStore.appendBuildOutput('line two\n')
      expect(state().buildOutput).toBe('line one\nline two\n')
    })

    it('resetBuild clears previously accumulated output', () => {
      consoleStore.appendBuildOutput('stale output')
      consoleStore.resetBuild()
      expect(state().buildOutput).toBe('')
    })
  })

  describe('position', () => {
    it('setPosition changes to bottom', () => {
      consoleStore.setPosition('bottom')
      expect(state().position).toBe('bottom')
    })

    it('setPosition changes back to right', () => {
      consoleStore.setPosition('bottom')
      consoleStore.setPosition('right')
      expect(state().position).toBe('right')
    })
  })

  describe('clearConsoleSignal', () => {
    it('starts at zero', () => {
      expect(get(clearConsoleSignal) as number).toBe(0)
    })

    it('increments when updated', () => {
      clearConsoleSignal.update(n => n + 1)
      expect(get(clearConsoleSignal) as number).toBeGreaterThan(0)
    })
  })
})