<script lang="ts">
  import '@reprojects/design-system/tokens.css';
  import Navbar from '$lib/components/Navbar.svelte';
  import CitySelectorModal from '$lib/components/CitySelectorModal.svelte';
  import AuthOnboardingModal from '$lib/components/AuthOnboardingModal.svelte';
  import type { Snippet } from 'svelte';

  interface Props { children: Snippet; }
  let { children }: Props = $props();
  let cityModalOpen = $state(false);
</script>

<Navbar onOpenCitySelector={() => (cityModalOpen = true)} />
<main>{@render children()}</main>
<CitySelectorModal open={cityModalOpen} onClose={() => (cityModalOpen = false)} />
<AuthOnboardingModal />
