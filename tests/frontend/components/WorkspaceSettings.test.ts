import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/svelte'
import { get } from 'svelte/store'
import WorkspaceSettings from '../../../src/settings/WorkspaceSettings.svelte'
import {
    settingsStore,
    DEFAULT_FONT_SIZE,
} from '../../../src/settings/settingsStore'

afterEach(() => {
    cleanup()
    settingsStore.updateSetting('reopenLastWorkspace', true)
    settingsStore.updateSetting('fontSize', DEFAULT_FONT_SIZE)
})

describe('WorkspaceSettings', () => {
    it('renders the section title', () => {
        const { getByText } = render(WorkspaceSettings)
        expect(getByText('Workspace')).toBeInTheDocument()
    })

    it('reflects the current reopenLastWorkspace setting', () => {
        settingsStore.updateSetting('reopenLastWorkspace', true)
        const { getByLabelText } = render(WorkspaceSettings)
        expect(
            getByLabelText('Reopen last workspace on startup'),
        ).toBeChecked()
    })

    it('updates the setting when the checkbox is toggled off', async () => {
        settingsStore.updateSetting('reopenLastWorkspace', true)
        const { getByLabelText } = render(WorkspaceSettings)
        const checkbox = getByLabelText('Reopen last workspace on startup')
        await fireEvent.click(checkbox)
        expect(get(settingsStore).reopenLastWorkspace).toBe(false)
    })

    it('persists the change via settingsStore', async () => {
        vi.stubGlobal('__TAURI__', {
            core: { invoke: vi.fn().mockResolvedValue(undefined) },
        })
        settingsStore.updateSetting('reopenLastWorkspace', true)
        const { getByLabelText } = render(WorkspaceSettings)
        const checkbox = getByLabelText('Reopen last workspace on startup')
        await fireEvent.click(checkbox)
        expect(window.__TAURI__.core.invoke).toHaveBeenCalledWith(
            'save_settings',
            expect.objectContaining({ content: expect.any(String) }),
        )
        vi.unstubAllGlobals()
    })
})
