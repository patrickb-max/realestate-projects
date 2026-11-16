<script lang="ts">
  import { goto } from '$app/navigation';
  import { session } from '$lib/stores/session.svelte';
  import { marketplace } from '$lib/stores/marketplace.svelte';
  import { DEFAULT_HTL_THRESHOLDS_SQFT, TIER_1_HTL_CITIES, USER_ROLES, type AssetClass } from '@reprojects/constants';

  let assetClass = $state<AssetClass>('office');
  let city = $state(session.selectedCity || 'Bengaluru');
  let primaryLocation = $state('');
  let secondaryInput = $state('');
  let secondaryLocations = $state<string[]>([]);
  let carpetAreaSqFt = $state<number>(6000);
  let possessionNeeded = $state('Immediate');
  let ocRequired = $state(true);

  let isHtlPreview = $derived.by(() => {
    if (assetClass === 'managed_space') return true;
    if (!TIER_1_HTL_CITIES.includes(city as any)) return false;
    if (session.user?.isEnterprise || session.user?.role === USER_ROLES.AGENT) return false;
    const threshold = DEFAULT_HTL_THRESHOLDS_SQFT[city] ?? 10000;
    return carpetAreaSqFt > threshold;
  });

  function addLocation() {
    const t = secondaryInput.trim();
    if (!t || secondaryLocations.length >= 4 || secondaryLocations.includes(t)) return;
    secondaryLocations = [...secondaryLocations, t];
    secondaryInput = '';
  }

  function submitDemand(e: SubmitEvent) {
    e.preventDefault();
    if (!session.user) { session.openLogin('Post Demand'); return; }

    marketplace.demands = [
      {
        demandId: `DM-${Math.floor(100000 + Math.random() * 900000)}`,
        posterId: session.user.userId,
        posterRole: session.user.role,
        posterDisplayName: session.isInternalTeam ? 'RealEstate Projects' : session.user.companyName || session.user.name,
        internalPosterName: session.isInternalTeam ? session.user.name : undefined,
        posterMobile: session.user.mobile,
        assetClass,
        transactionType: 'lease',
        city,
        primaryLocation,
        secondaryLocations,
        carpetAreaSqFt,
        possessionNeeded,
        ocRequired,
        isHighTicketLead: isHtlPreview,
        isHtlUnlockedByAdmin: false,
        viewedByTeam: [],
        relevancyCount: 2,
        hasUnreadMatches: true,
        createdAt: new Date().toISOString()
      },
      ...marketplace.demands
    ];
    goto('/dashboard');
  }
</script>

<div class="form-container">
  <h1>Post a Space Demand</h1>
  <form class="card" onsubmit={submitDemand}>
    <div class="grid-2">
      <label><span>Asset Class *</span>
        <select bind:value={assetClass}>
          {#if session.user?.role === USER_ROLES.RETAIL_BRAND}
            <option value="retail">Retail</option>
          {:else if session.user?.role === USER_ROLES.FNB_BRAND}
            <option value="fnb">F&amp;B</option>
          {:else if session.user?.role === USER_ROLES.MANAGED_SPACE_TENANT}
            <option value="managed_space">Managed Space</option>
          {:else}
            <option value="office">Office</option>
            <option value="retail">Retail</option>
            <option value="fnb">F&amp;B</option>
            {#if session.isInternalTeam || session.user?.canPostManagedSpace}
              <option value="managed_space">Managed Space</option>
            {/if}
          {/if}
        </select>
      </label>
      <label><span>City *</span>
        <select bind:value={city}>
          <option value="Bengaluru">Bengaluru</option><option value="Mumbai">Mumbai</option>
          <option value="Hyderabad">Hyderabad</option><option value="Pune">Pune</option>
          <option value="Jaipur">Jaipur (Tier 2)</option>
        </select>
      </label>
    </div>

    <div class="grid-2">
      <label><span>Primary Location *</span><input type="text" required bind:value={primaryLocation} /></label>
      <label><span>Carpet Area Required (sq. ft.) *</span><input type="number" min="100" required bind:value={carpetAreaSqFt} /></label>
    </div>

    <div>
      <label><span>Additional Preferred Locations (Max 4 in {city})</span></label>
      <div class="inline">
        <input type="text" bind:value={secondaryInput} placeholder="Add locality..." />
        <button type="button" onclick={addLocation} disabled={secondaryLocations.length >= 4}>+ Add</button>
      </div>
      <div class="chips">{#each secondaryLocations as l}<span class="chip">{l}</span>{/each}</div>
    </div>

    <div class="grid-2">
      <label><span>Possession Needed *</span>
        <select bind:value={possessionNeeded}><option value="Immediate">Immediate</option><option value="In 3 months">In 3 months</option><option value="In 6 months">In 6 months</option></select>
      </label>
      <label><span>OC Required *</span>
        <select bind:value={ocRequired}><option value={true}>Yes</option><option value={false}>No</option></select>
      </label>
    </div>

    {#if isHtlPreview}
      <div class="htl-note">★ Classified as a <strong>High-Ticket Lead (HTL)</strong> — routed exclusively to our internal Relationship Manager roster and hidden from external agents.</div>
    {/if}

    <button type="submit" class="btn">Submit Requirement</button>
  </form>
</div>

<style>
  .form-container { max-width: 760px; margin: 2rem auto; padding: 0 1.25rem; }
  h1 { color: var(--color-primary); }
  .card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  label { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.84rem; font-weight: 600; }
  input, select { padding: 0.6rem; border: 1px solid var(--color-border); border-radius: var(--radius-sm); }
  .inline { display: flex; gap: 0.5rem; }
  .chips { display: flex; gap: 0.4rem; margin-top: 0.4rem; flex-wrap: wrap; }
  .chip { background: #dbeafe; color: var(--color-primary); padding: 0.2rem 0.65rem; border-radius: var(--radius-pill); font-size: 0.78rem; font-weight: 600; }
  .htl-note { background: var(--color-premium-bg); color: var(--color-premium-gold); padding: 0.75rem; border-radius: var(--radius-sm); font-size: 0.85rem; }
  .btn { background: var(--color-primary); color: #fff; border: none; padding: 0.7rem; border-radius: var(--radius-sm); font-weight: 600; }
</style>
