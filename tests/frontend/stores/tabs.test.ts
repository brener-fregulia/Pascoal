import { describe, it, expect, beforeEach, vi } from 'vitest'
import { get } from 'svelte/store'
import { tabStore } from "@stores/tabs";

describe('tabStore', () => {
  beforeEach(() => {
    tabStore.reset()
  })

  describe('newTab', () => {
    it('creates untitled.pas when no tabs exist', async () => {
      const tab = await tabStore.newTab('content')
      expect(tab.fileName).toBe('untitled.pas')
      expect(tab.filePath).toBeNull()
      expect(tab.isDirty).toBe(false)
    })

    it('increments name when untitled.pas already open', async () => {
      await tabStore.newTab('first')
      const second = await tabStore.newTab('second')
      expect(second.fileName).toBe('untitled-2.pas')
    })

    it('increments correctly with multiple untitled tabs', async () => {
      await tabStore.newTab('first')
      await tabStore.newTab('second')
      const third = await tabStore.newTab('third')
      expect(third.fileName).toBe('untitled-3.pas')
    })

    it('adds tab to store', async () => {
      await tabStore.newTab('content')
      expect(get(tabStore).tabs).toHaveLength(1)
    })
  })

  describe('openFile', () => {
    it('opens a file and sets filePath and fileName', async () => {
      const tab = await tabStore.openFile('/path/to/hello.pas', 'program Hello;')
      expect(tab.filePath).toBe('/path/to/hello.pas')
      expect(tab.fileName).toBe('hello.pas')
    })

    it('does not open duplicate — activates existing tab instead', async () => {
      const first = await tabStore.openFile('/path/to/hello.pas', 'content')
      const second = await tabStore.openFile('/path/to/hello.pas', 'content')
      expect(first.id).toBe(second.id)
      expect(get(tabStore).tabs).toHaveLength(1)
    })

    it('opens different files as separate tabs', async () => {
      await tabStore.openFile('/path/to/a.pas', 'a')
      await tabStore.openFile('/path/to/b.pas', 'b')
      expect(get(tabStore).tabs).toHaveLength(2)
    })
  })

  describe('activate', () => {
    it('sets activeTabId and switches view to editor', async () => {
      const tab = await tabStore.newTab('content')
      tabStore.activate(tab.id)
      const state = get(tabStore)
      expect(state.activeTabId).toBe(tab.id)
      expect(state.activeView).toBe('editor')
    })
  })

  describe('showWelcome', () => {
    it('switches view back to welcome', async () => {
      const tab = await tabStore.newTab('content')
      tabStore.activate(tab.id)
      tabStore.showWelcome()
      expect(get(tabStore).activeView).toBe('welcome')
    })
  })

  describe('markDirty / markClean', () => {
    it('marks tab as dirty', async () => {
      const tab = await tabStore.newTab('content')
      tabStore.markDirty(tab.id)
      const found = get(tabStore).tabs.find(t => t.id === tab.id)
      expect(found?.isDirty).toBe(true)
    })

    it('marks tab as clean', async () => {
      const tab = await tabStore.newTab('content')
      tabStore.markDirty(tab.id)
      tabStore.markClean(tab.id)
      const found = get(tabStore).tabs.find(t => t.id === tab.id)
      expect(found?.isDirty).toBe(false)
    })
  })

  describe('close', () => {
    it('removes tab from store', async () => {
      const tab = await tabStore.newTab('content')
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      await tabStore.close(tab.id)
      expect(get(tabStore).tabs).toHaveLength(0)
    })

    it('switches to welcome when last tab is closed', async () => {
      const tab = await tabStore.newTab('content')
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      await tabStore.close(tab.id)
      expect(get(tabStore).activeView).toBe('welcome')
    })

    it('activates adjacent tab when closing active tab', async () => {
      const first = await tabStore.newTab('first')
      const second = await tabStore.newTab('second')
      tabStore.activate(second.id)
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      await tabStore.close(second.id)
      expect(get(tabStore).activeTabId).toBe(first.id)
    })

    it('does not close dirty tab if user cancels', async () => {
      const tab = await tabStore.newTab('content')
      tabStore.markDirty(tab.id)
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      await tabStore.close(tab.id)
      expect(get(tabStore).tabs).toHaveLength(1)
    })
  })

  describe('updateFilePath', () => {
    it('updates filePath and fileName on save as', async () => {
      const tab = await tabStore.newTab('content')
      tabStore.updateFilePath(tab.id, '/new/path/program.pas')
      const found = get(tabStore).tabs.find(t => t.id === tab.id)
      expect(found?.filePath).toBe('/new/path/program.pas')
      expect(found?.fileName).toBe('program.pas')
    })
  })

  describe('getActive', () => {
    it('returns null when no tab is active', () => {
      expect(tabStore.getActive()).toBeNull()
    })

    it('returns the active tab', async () => {
      const tab = await tabStore.newTab('content')
      tabStore.activate(tab.id)
      expect(tabStore.getActive()?.id).toBe(tab.id)
    })
  })
})
