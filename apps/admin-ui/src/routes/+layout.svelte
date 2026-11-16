<script lang="ts">
  import '@reprojects/design-system/tokens.css';
  import type { Snippet } from 'svelte';

  interface Props { children: Snippet; }
  let { children }: Props = $props();
</script>

{@render children()}
