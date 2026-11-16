<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'gold' | 'primary';
    dot?: boolean;
    children: Snippet;
  }

  let { variant = 'neutral', dot = false, children }: Props = $props();
</script>

<span class="rep-badge rep-badge--{variant}">
  {#if dot}
    <span class="rep-badge__dot" aria-hidden="true"></span>
  {/if}
  {@render children()}
</span>

<style>
  .rep-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.2rem 0.6rem;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: var(--radius-pill);
    white-space: nowrap;
  }
  .rep-badge__dot {
    width: 0.45rem;
    height: 0.45rem;
    border-radius: 50%;
    background-color: var(--color-alert-dot);
  }
  .rep-badge--neutral { background: #e5e7eb; color: #374151; }
  .rep-badge--success { background: var(--color-success-bg); color: var(--color-success); }
  .rep-badge--warning { background: var(--color-warning-bg); color: var(--color-warning); }
  .rep-badge--danger  { background: #fee2e2; color: var(--color-alert-dot); }
  .rep-badge--gold    { background: var(--color-premium-bg); color: var(--color-premium-gold); }
  .rep-badge--primary { background: #dbeafe; color: var(--color-primary); }
</style>
