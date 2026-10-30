import { get } from 'svelte/store'
import { isTauriAvailable } from '../integrations/tauri/client'
import { tabStore } from '../editor/tabs'

/**
 * Typed catalog of the commands exposed by the Command Palette.
 *
 * The catalog only describes commands; execution stays with the handlers
 * that already own each behavior (see
 * docs/discovery/command-palette-command-contract.md). Commands that have a
 * `menu-*` event emit it, so the palette behaves exactly like the File and
 * Edit menus.
 */

export type CommandId =
  | 'file.new'
  | 'file.open'
  | 'workspace.open'
  | 'search.findInFiles'
  | 'file.save'
  | 'file.saveAs'
  | 'edit.find'
  | 'edit.replace'
  | 'edit.toggleLineComment'

/** State owned by App.svelte that availability depends on. */
export interface CommandContext {
  activePanel: string | null
}

export interface Command {
  id: CommandId
  /** Existing translation key used as the visible, searchable label. */
  labelKey: string
  isAvailable(ctx: CommandContext): boolean
  run(): Promise<void>
}

// The editor commands are handled by the listeners of Editor.svelte (Save
// and Save As through the synthetic shortcut dispatched by App.svelte).
// Editor.svelte is not rendered in the Settings view, and while the Welcome
// or a diff tab is shown it stays mounted but hidden.
function isEditorAvailable(ctx: CommandContext): boolean {
  if (!isTauriAvailable() || ctx.activePanel === 'settings') return false
  return get(tabStore).activeView === 'editor' && tabStore.getActive() !== null
}

// Emits the same event as the menu item, so the existing listener runs.
function eventCommand(
  id: CommandId,
  labelKey: string,
  event: string,
  isAvailable: (ctx: CommandContext) => boolean = () => isTauriAvailable(),
): Command {
  return {
    id,
    labelKey,
    isAvailable,
    async run() {
      const { emit } = await import('@tauri-apps/api/event')
      await emit(event)
    },
  }
}

// Follows the order of the File and Edit menus.
export const commands: readonly Command[] = [
  eventCommand('file.new', 'menu.new_file', 'menu-new-file'),
  eventCommand('file.open', 'menu.open_file', 'menu-open-file'),
  eventCommand('workspace.open', 'menu.open_folder', 'menu-open-folder'),
  eventCommand('file.save', 'menu.save', 'menu-save-file', isEditorAvailable),
  eventCommand(
    'file.saveAs',
    'menu.save_as',
    'menu-save-file-as',
    isEditorAvailable,
  ),
  eventCommand('edit.find', 'menu.find', 'menu-find', isEditorAvailable),
  eventCommand(
    'edit.replace',
    'menu.replace',
    'menu-replace',
    isEditorAvailable,
  ),
  eventCommand(
    'search.findInFiles',
    'menu.find_in_files',
    'menu-find-in-files',
  ),
  eventCommand(
    'edit.toggleLineComment',
    'menu.toggle_line_comment',
    'menu-toggle-comment',
    isEditorAvailable,
  ),
]

export function availableCommands(
  ctx: CommandContext,
  catalog: readonly Command[] = commands,
): Command[] {
  return catalog.filter((command) => command.isAvailable(ctx))
}

/** Lowercases and strips diacritics so "Pasta" matches "pásta". */
export function normalizeSearchText(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

/**
 * Keeps the commands whose translated label contains the query, in catalog
 * order. `translate` is the translator of the selected locale.
 */
export function filterCommands(
  list: readonly Command[],
  query: string,
  translate: (key: string) => string,
): Command[] {
  const needle = normalizeSearchText(query.trim())
  if (!needle) return [...list]
  return list.filter((command) =>
    normalizeSearchText(translate(command.labelKey)).includes(needle),
  )
}

/**
 * Runs a command after checking its availability again, since the context
 * may have changed after the palette listed it. Failures are logged like the
 * existing handlers do. Returns whether the command was run.
 */
export async function executeCommand(
  command: Command,
  ctx: CommandContext,
): Promise<boolean> {
  if (!command.isAvailable(ctx)) return false
  try {
    await command.run()
  } catch (e) {
    console.error(`Command ${command.id} failed:`, e)
  }
  return true
}
