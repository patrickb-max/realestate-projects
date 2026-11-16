<script lang="ts">
  import { session } from '$lib/stores/session.svelte';
  import { USER_ROLES } from '@reprojects/constants';

  interface Props { open: boolean; onClose: () => void; }
  let { open, onClose }: Props = $props();
  let showOtherCities = $state(false);
  let cityQuery = $state('');

  const TOP_CITIES = [
    { name: 'Bengaluru', tooltip: 'Includes CBD, ORR, Whitefield, Electronic City, North Bengaluru' },
    { name: 'Mumbai', tooltip: 'MMR: Mumbai City, Suburban, Navi Mumbai, Thane, Kalyan-Dombivli' },
    { name: 'Delhi NCR', tooltip: 'Includes New Delhi, Gurugram, Noida, Greater Noida, Faridabad, Ghaziabad' },
    { name: 'Hyderabad', tooltip: 'Includes HITEC City, Gachibowli, Financial District, Banjara Hills' },
    { name: 'Pune', tooltip: 'Pune / PCMC: Hinjewadi, Kharadi, Baner, Viman Nagar, Magarpatta' },
    { name: 'Chennai', tooltip: 'Includes OMR, Guindy, Anna Salai, Ambattur, Mount Poonamallee' },
    { name: 'Kolkata', tooltip: 'Includes Salt Lake Sector V, New Town, Park Street, Camac Street' }
  ];

  const ACTIVE_OTHER_CITIES = ['Ahmedabad', 'Chandigarh', 'Coimbatore', 'Indore', 'Jaipur', 'Kochi', 'Lucknow', 'Nashik', 'Surat'];

  let allowedCities = $derived.by(() => {
    if (session.user?.role === USER_ROLES.AGENT && session.user.isSubscribedAgent && session.user.subscribedCities.length > 0) {
      return session.user.subscribedCities;
    }
    return null;
  });

  let filteredOtherCities = $derived(
    ACTIVE_OTHER_CITIES.filter((c) => {
      const matchesQuery = c.toLowerCase().includes(cityQuery.trim().toLowerCase());
      const matchesPlan = !allowedCities || allowedCities.includes(c);
      return matchesQuery && matchesPlan;
    })
  );

  function selectCity(city: string) {
    session.selectedCity = city;
    showOtherCities = false;
    onClose();
  }
</script>

{#if open}
  <div class="modal-backdrop" role="presentation" onclick={onClose}>
    <div class="modal-card" role="dialog" aria-modal="true" onclick={(e) => e.stopPropagation()}>
      <header class="modal-header">
        <div>
          <h3>Select Operating Market</h3>
          <p class="muted">Showing markets with active approved commercial inventory</p>
        </div>
        <button type="button" class="close-btn" onclick={onClose}>✕</button>
      </header>

      <div class="city-grid">
        {#each TOP_CITIES as item}
          {@const disabled = allowedCities !== null && !allowedCities.includes(item.name)}
          <button
            type="button"
            class="city-tile"
            class:city-tile--active={session.selectedCity === item.name}
            {disabled}
            title={item.tooltip}
            onclick={() => selectCity(item.name)}
          >
            <span>{item.name}</span>
            <span class="info-badge" title={item.tooltip}>i</span>
          </button>
        {/each}
        <button type="button" class="city-tile city-tile--other" onclick={() => (showOtherCities = !showOtherCities)}>
          {showOtherCities ? 'Hide Other Cities' : '+ Other City'}
        </button>
      </div>

      {#if showOtherCities}
        <div class="other-cities-box">
          <input type="search" placeholder="Search active cities..." bind:value={cityQuery} class="city-search" />
          <div class="other-cities-list">
            {#each filteredOtherCities as city}
              <button type="button" class="other-city-chip" onclick={() => selectCity(city)}>{city}</button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal-backdrop { position: fixed; inset: 0; background: rgba(17, 24, 39, 0.55); z-index: var(--z-modal); display: grid; place-items: center; padding: 1rem; }
  .modal-card { background: var(--color-surface); width: min(680px, 100%); border-radius: var(--radius-lg); padding: 1.5rem; box-shadow: var(--shadow-md); }
  .modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
  .modal-header h3 { margin: 0; color: var(--color-primary); }
  .muted { margin: 0.2rem 0 0; font-size: 0.84rem; color: var(--color-text-muted); }
  .close-btn { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 0.3rem 0.6rem; }
  .city-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(145px, 1fr)); gap: 0.75rem; }
  .city-tile { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0.9rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); font-weight: 600; }
  .city-tile--active { border-color: var(--color-primary); background: var(--color-primary); color: #fff; }
  .city-tile:disabled { opacity: 0.45; cursor: not-allowed; }
  .city-tile--other { border-style: dashed; color: var(--color-accent); justify-content: center; }
  .info-badge { display: inline-grid; place-items: center; width: 1.1rem; height: 1.1rem; border-radius: 50%; font-size: 0.7rem; background: rgba(15, 41, 74, 0.12); }
  .other-cities-box { margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--color-border); }
  .city-search { width: 100%; padding: 0.6rem 0.85rem; border: 1px solid var(--color-border); border-radius: var(--radius-sm); margin-bottom: 0.75rem; }
  .other-cities-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .other-city-chip { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-pill); padding: 0.35rem 0.85rem; font-size: 0.84rem; }
</style>
