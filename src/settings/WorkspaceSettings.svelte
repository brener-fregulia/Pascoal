<script lang="ts">
  import { i18n } from '../i18n'
  import { settingsStore } from './settingsStore'
</script>

<section>
  <h3>{$i18n('settings.category_workspace')}</h3>

  <div class="field checkbox-field">
    <label class="checkbox-label" for="reopen-last-workspace">
      <input
        id="reopen-last-workspace"
        type="checkbox"
        checked={$settingsStore.reopenLastWorkspace}
        onchange={(e) =>
          settingsStore.updateSetting(
            'reopenLastWorkspace',
            (e.target as HTMLInputElement).checked,
          )}
      />
      {$i18n('settings.reopen_last_workspace_label')}
    </label>
    <p class="hint">{$i18n('settings.reopen_last_workspace_hint')}</p>
  </div>
</section>

<style>
  section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 360px;
  }

  h3 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--text);
    font-family: var(--font-ui);
    cursor: pointer;
  }

  .hint {
    font-size: 12px;
    color: var(--text-dim);
    margin: 0;
    padding-left: 22px;
  }
</style>
