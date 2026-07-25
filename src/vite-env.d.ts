/// <reference types="svelte" />
/// <reference types="vite/client" />

declare global {
  interface Window {
    __TAURI__: any
    __documentsDir: string
    __platform: string
  }
}

export {}
