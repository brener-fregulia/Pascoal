import { writable } from 'svelte/store'

// Shell-owned state of the optional right panel. `open` is the user's
// explicit choice; `available` is set by the layout and says whether the
// window currently has room for the panel without squeezing the editor.
interface RightPanelState {
  open: boolean
  available: boolean
}

function createRightPanelStore() {
  const { subscribe, update, set } = writable<RightPanelState>({
    open: false,
    available: true,
  })

  return {
    subscribe,
    toggle: () => update((s) => ({ ...s, open: !s.open })),
    setAvailable: (available: boolean) =>
      update((s) => (s.available === available ? s : { ...s, available })),
    reset: () => set({ open: false, available: true }),
  }
}

export const rightPanelStore = createRightPanelStore()
