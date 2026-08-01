import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'

const { mockConsoleState, mockHide } = vi.hoisted(() => ({
    mockConsoleState: {
        buildStatus: 'idle' as 'idle' | 'compiling' | 'success' | 'error',
        buildOutput: '',
    },
    mockHide: vi.fn(),
}))

vi.mock('../../../src/toolchain/console', () => ({
    consoleStore: {
        subscribe: (fn: (v: typeof mockConsoleState) => void) => {
            fn(mockConsoleState)
            return () => { }
        },
        hide: mockHide,
        appendBuildOutput: vi.fn(),
        setBuildStatus: vi.fn(),
        setRunning: vi.fn(),
    },
    clearConsoleSignal: {
        subscribe: (fn: (v: number) => void) => {
            fn(0)
            return () => { }
        },
    },
}))

const mockTermReset = vi.fn()

vi.mock('@xterm/xterm', () => ({
    Terminal: vi.fn().mockImplementation(function () {
        return {
            loadAddon: vi.fn(),
            open: vi.fn(),
            onData: vi.fn(),
            write: vi.fn(),
            reset: mockTermReset,
            dispose: vi.fn(),
            getSelection: vi.fn().mockReturnValue(''),
            buffer: { active: { length: 0, getLine: vi.fn() } },
        }
    }),
}))

vi.mock('@xterm/addon-fit', () => ({
    FitAddon: vi.fn().mockImplementation(function () {
        return { fit: vi.fn() }
    }),
}))

import Console from '../../../src/toolchain/Console.svelte'

async function flushSetup() {
    // onMount's setup() does several chained `await import(...)` calls
    // before assigning `term` - give those a chance to settle before
    // interacting with anything that depends on it.
    await new Promise((resolve) => setTimeout(resolve, 0))
}

beforeEach(() => {
    vi.stubGlobal(
        'ResizeObserver',
        vi.fn().mockImplementation(function () {
            return { observe: vi.fn(), disconnect: vi.fn() }
        }),
    )
    Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn() },
        configurable: true,
    })
})

afterEach(() => {
    cleanup()
    mockConsoleState.buildStatus = 'idle'
    mockConsoleState.buildOutput = ''
    vi.clearAllMocks()
})

describe('Console', () => {
    it('shows the idle status label by default', () => {
        const { getByText } = render(Console)
        expect(getByText('No build yet')).toBeInTheDocument()
    })

    it('shows the build output when present', () => {
        mockConsoleState.buildOutput = 'Compiling program.pas...'
        const { getByText } = render(Console)
        expect(getByText('Compiling program.pas...')).toBeInTheDocument()
    })

    it('does not render a build output block when there is none', () => {
        const { container } = render(Console)
        expect(container.querySelector('.build-output')).toBeNull()
    })

    it('shows the compiling status label', () => {
        mockConsoleState.buildStatus = 'compiling'
        const { getByText } = render(Console)
        expect(getByText('Compiling...')).toBeInTheDocument()
    })

    it('shows the build-failed status label and error styling', () => {
        mockConsoleState.buildStatus = 'error'
        const { container, getByText } = render(Console)
        expect(getByText('Build failed')).toBeInTheDocument()
        expect(
            container.querySelector('.console-build.error'),
        ).toBeInTheDocument()
    })

    it('calls consoleStore.hide when the close button is clicked', async () => {
        const { getByTitle } = render(Console)
        await fireEvent.click(getByTitle('Close'))
        expect(mockHide).toHaveBeenCalled()
    })

    it('resets the terminal when the clear button is clicked', async () => {
        const { getByTitle } = render(Console)
        await flushSetup()
        await fireEvent.click(getByTitle('Clear'))
        expect(mockTermReset).toHaveBeenCalled()
    })
})