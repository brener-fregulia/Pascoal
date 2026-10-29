import { isTauriAvailable } from '../integrations/tauri/client'

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

export interface Command {
  id: CommandId
  /** Existing translation key used as the visible, searchable label. */
  labelKey: string
  isAvailable(): boolean
  run(): Promise<void>
}

// Handled by the listeners registered in App.svelte, like the menu items.
function eventCommand(id: CommandId, labelKey: string, event: string): Command {
  return {
    id,
    labelKey,
    isAvailable: isTauriAvailable,
    async run() {
      const { emit } = await import('@tauri-apps/api/event')
      await emit(event)
    },
  }
}

export const commands: readonly Command[] = [
  eventCommand('file.new', 'menu.new_file', 'menu-new-file'),
  eventCommand('file.open', 'menu.open_file', 'menu-open-file'),
  eventCommand('workspace.open', 'menu.open_folder', 'menu-open-folder'),
  eventCommand(
    'search.findInFiles',
    'menu.find_in_files',
    'menu-find-in-files',
  ),
]

export function availableCommands(
  catalog: readonly Command[] = commands,
): Command[] {
  return catalog.filter((command) => command.isAvailable())
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
export async function executeCommand(command: Command): Promise<boolean> {
  if (!command.isAvailable()) return false
  try {
    await command.run()
  } catch (e) {
    console.error(`Command ${command.id} failed:`, e)
  }
  return true
}
