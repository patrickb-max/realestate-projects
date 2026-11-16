<script lang="ts">
  import { session } from '$lib/stores/session.svelte';
  import { marketplace } from '$lib/stores/marketplace.svelte';
  import Badge from '@reprojects/design-system/Badge.svelte';
</script>

<div style="max-width: 1040px; margin: 2rem auto; padding: 0 1.25rem;">
  <h1 style="color: var(--color-primary);">Explore Demands (Internal Team Directory)</h1>
  {#if !session.canExploreDemands}
    <p>Access restricted strictly to internal RealEstate Projects team members[cite: 2, 10].</p>
  {:else}
    {#each marketplace.demands as d}
      <div style="background: #fff; border: 1px solid var(--color-border); border-radius: 10px; padding: 1rem; margin-bottom: 0.75rem;">
        <Badge variant="primary">{d.demandId}</Badge>
        {#if d.isHighTicketLead}<Badge variant="gold">High-Ticket Lead</Badge>{/if}
        <h3 style="margin: 0.4rem 0;">{d.posterDisplayName} — {d.city} ({d.primaryLocation})</h3>
        <p style="margin: 0; color: var(--color-text-muted);">{d.assetClass.toUpperCase()} · {d.carpetAreaSqFt.toLocaleString()} sq. ft. · Contact: {d.posterMobile}</p>
      </div>
    {/each}
  {/if}
</div>
