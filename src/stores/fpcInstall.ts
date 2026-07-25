import { writable } from 'svelte/store'

export type FpcInstallStatus = 'idle' | 'installing' | 'success' | 'error'

interface FpcInstallState {
    visible: boolean
    status: FpcInstallStatus
    output: string
    packageManager: string | null
}

function createFpcInstallStore() {
    const { subscribe, update, set } = writable<FpcInstallState>({
        visible: false,
        status: 'idle',
        output: '',
        packageManager: null,
    })

    function show() {
        update((s) => ({ ...s, visible: true, status: 'idle', output: '' }))
        detectPackageManager()
    }

    function hide() {
        update((s) => ({ ...s, visible: false }))
    }

    async function detectPackageManager() {
        if (!window.__TAURI__) return
        try {
            const pm = (await window.__TAURI__.core.invoke(
                'detect_installer',
            )) as string | null
            update((s) => ({ ...s, packageManager: pm }))
        } catch (e) {
            console.error('detect_installer failed:', e)
        }
    }

    async function install() {
        if (!window.__TAURI__) return
        update((s) => ({ ...s, status: 'installing', output: '' }))
        try {
            await window.__TAURI__.core.invoke('install_fpc')
        } catch (e) {
            update((s) => ({
                ...s,
                status: 'error',
                output: s.output + `${e}\n`,
            }))
        }
    }

    function appendOutput(chunk: string) {
        update((s) => ({ ...s, output: s.output + chunk }))
    }

    function setSuccess() {
        update((s) => ({ ...s, status: 'success' }))
    }

    function setError(message: string) {
        update((s) => ({
            ...s,
            status: 'error',
            output: s.output + `${message}\n`,
        }))
    }

    return {
        subscribe,
        show,
        hide,
        detectPackageManager,
        install,
        appendOutput,
        setSuccess,
        setError,
    }
}

export const fpcInstallStore = createFpcInstallStore()