<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    open: boolean;
    title: string;
    subtitle?: string;
    showBack?: boolean;
    onBack?: () => void;
    onClose: () => void;
    children: Snippet;
  }

  let { open, title, subtitle = '', showBack = false, onBack, onClose, children }: Props = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (open && e.key === 'Escape') onClose();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div class="drawer-backdrop" role="presentation" onclick={onClose}>
    <aside
      class="drawer-panel"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onclick={(e) => e.stopPropagation()}
    >
      <header class="drawer-header">
        <div class="drawer-header__left">
          {#if showBack && onBack}
            <button type="button" class="icon-btn" onclick={onBack}>← Back</button>
          {/if}
          <div>
            <h2 class="drawer-title">{title}</h2>
            {#if subtitle}<p class="drawer-subtitle">{subtitle}</p>{/if}
          </div>
        </div>
        <button type="button" class="icon-btn" onclick={onClose} aria-label="Close">✕</button>
      </header>
      <div class="drawer-body">{@render children()}</div>
    </aside>
  </div>
{/if}

<style>
  .drawer-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(17, 24, 39, 0.45);
    z-index: var(--z-drawer);
    display: flex;
    justify-content: flex-end;
  }
  .drawer-panel {
    width: min(560px, 100vw);
    height: 100%;
    background: var(--color-surface);
    box-shadow: -8px 0 24px rgba(0, 0, 0, 0.16);
    display: flex;
    flex-direction: column;
  }
  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--color-border);
  }
  .drawer-header__left { display: flex; align-items: center; gap: 0.75rem; }
  .drawer-title { margin: 0; font-size: 1.1rem; color: var(--color-primary); }
  .drawer-subtitle { margin: 0.15rem 0 0; font-size: 0.82rem; color: var(--color-text-muted); }
  .drawer-body { flex: 1; overflow-y: auto; padding: 1.25rem; }
  .icon-btn {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 0.35rem 0.65rem;
    font-size: 0.85rem;
    font-weight: 600;
  }
</style>
