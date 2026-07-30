/**
 * Single point of contact with the Tauri IPC bridge. Every call site that
 * needs to invoke a Rust command should go through here instead of touching
 * window.__TAURI__ directly - this is what lets us change command names,
 * add typed payloads/return values, or swap the underlying bridge without
 * hunting through every store/component.
 */

export function isTauriAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.__TAURI__
}

export async function invoke<T>(command: string, payload?: Record<string, unknown>): Promise<T> {
    if (!isTauriAvailable()) {
        throw new Error(`Tauri is not available - cannot invoke "${command}"`)
    }
    return window.__TAURI__.core.invoke(command, payload) as Promise<T>
}