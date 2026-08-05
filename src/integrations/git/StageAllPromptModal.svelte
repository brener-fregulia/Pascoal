<script lang="ts">
  import { i18n } from '../../i18n'

  let {
    onChoice,
  }: {
    onChoice: (choice: 'yes' | 'always' | 'never' | 'cancel') => void
  } = $props()
</script>

<div class="backdrop" onclick={() => onChoice('cancel')}>
  <div class="modal" onclick={(e) => e.stopPropagation()}>
    <p class="message">{$i18n('git.stage_prompt_message')}</p>
    <div class="actions">
      <button class="btn" onclick={() => onChoice('yes')}>
        {$i18n('git.stage_prompt_yes')}
      </button>
      <button class="btn" onclick={() => onChoice('always')}>
        {$i18n('git.stage_prompt_always')}
      </button>
      <button class="btn" onclick={() => onChoice('never')}>
        {$i18n('git.stage_prompt_never')}
      </button>
      <button class="btn btn-cancel" onclick={() => onChoice('cancel')}>
        {$i18n('git.stage_prompt_cancel')}
      </button>
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 20px;
    max-width: 340px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .message {
    font-family: var(--font-ui);
    font-size: 13px;
    color: var(--text);
    line-height: 1.5;
    margin: 0;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
  }

  .btn {
    padding: 6px 12px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-ui);
    font-size: 12px;
    cursor: pointer;
  }

  .btn:hover {
    border-color: var(--accent2);
  }

  .btn-cancel {
    color: var(--text-dim);
  }
</style>
