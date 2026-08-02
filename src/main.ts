import { mount } from 'svelte'
import App from './App.svelte'
import './styles/global.css'
import { settingsStore } from './app/settings'

if (import.meta.env.DEV) {
    (window as unknown as { settingsStore: typeof settingsStore }).settingsStore = settingsStore
}

settingsStore.load().finally(() => {
    mount(App, { target: document.getElementById('app')! })
})