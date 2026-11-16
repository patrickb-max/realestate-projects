<script lang="ts">
  import { goto } from '$app/navigation';
  import { session } from '$lib/stores/session.svelte';
  import { marketplace } from '$lib/stores/marketplace.svelte';
  import type { AssetClass } from '@reprojects/constants';

  let assetClass = $state<AssetClass>('office');
  let projectName = $state('');
  let storeType = $state('Commercial Tower');
  let city = $state(session.selectedCity || 'Bengaluru');
  let primaryLocation = $state('');
  let carpetAreaSqFt = $state<number>(2500);
  let builtUpAreaSqFt = $state<number>(3200);
  let quotedRentInr = $state<number>(225000);
  let floor = $state('4th Floor');
  let possession = $state('Immediate');
  let ocStatus = $state('Ready');
  let hideImages = $state(false);
  let frontSideImg = $state('https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80');
  let formError = $state('');

  let ratePerSqFt = $derived(carpetAreaSqFt > 0 ? Math.round((quotedRentInr / carpetAreaSqFt) * 100) / 100 : 0);

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!session.user) { session.openLogin('Post Property'); return; }
    if (carpetAreaSqFt > builtUpAreaSqFt) { formError = 'Carpet Area must be <= Built-up Area.'; return; }

    marketplace.properties = [
      {
        propertyId: `PR-${Math.floor(100000 + Math.random() * 900000)}`,
        ownerId: session.user.userId,
        ownerRole: session.user.role,
        ownerDisplayName: session.isInternalTeam ? 'RealEstate Projects' : session.user.name,
        internalPosterName: session.isInternalTeam ? session.user.name : undefined,
        ownerMobile: session.user.mobile,
        assetClass,
        transactionType: 'lease',
        projectName: projectName || undefined,
        storeType,
        displayTitle: projectName.trim() || `${storeType} ${assetClass.toUpperCase()} Property for Lease`,
        city,
        primaryLocation,
        secondaryLocations: [],
        carpetAreaSqFt,
        builtUpAreaSqFt,
        quotedRentInr,
        ratePerSqFtInr: ratePerSqFt,
        floor,
        possession,
        ocStatus,
        hideImages,
        visibilityScope: 'public',
        thumbnailUrl: frontSideImg,
        relevancyCount: 1,
        hasUnreadMatches: true,
        createdAt: new Date().toISOString()
      },
      ...marketplace.properties
    ];
    goto('/');
  }
</script>

<div class="form-container">
  <h1>Post a Property</h1>
  {#if !session.canPostProperty}
    <div class="card"><p>Only Property Agents and Internal Team members can list properties.</p><a href="/post/demand">Go to Post Demand →</a></div>
  {:else}
    <form class="card" onsubmit={handleSubmit}>
      {#if formError}<div class="err">{formError}</div>{/if}
      <div class="grid-2">
        <label><span>Asset Class *</span>
          <select bind:value={assetClass}>
            <option value="office">Office</option><option value="retail">Retail</option><option value="fnb">F&amp;B</option>
            {#if session.isInternalTeam}<option value="managed_space">Managed Space</option>{/if}
          </select>
        </label>
        <label><span>Project Name (Optional)</span><input type="text" bind:value={projectName} /></label>
      </div>
      <div class="grid-2">
        <label><span>City *</span>
          <select bind:value={city}>
            <option value="Bengaluru">Bengaluru</option><option value="Mumbai">Mumbai</option>
            <option value="Delhi NCR">Delhi NCR</option><option value="Hyderabad">Hyderabad</option>
          </select>
        </label>
        <label><span>Primary Locality *</span><input type="text" required bind:value={primaryLocation} /></label>
      </div>
      <div class="grid-3">
        <label><span>Carpet Area (sq. ft.) *</span><input type="number" min="100" required bind:value={carpetAreaSqFt} /></label>
        <label><span>Built-up Area (sq. ft.) *</span><input type="number" min="100" required bind:value={builtUpAreaSqFt} /></label>
        <label><span>Quoted Rent (₹/mo) *</span><input type="number" min="1000" required bind:value={quotedRentInr} /></label>
      </div>
      <div class="calc">Auto-Calculated Rate: <strong>₹{ratePerSqFt}/sq. ft.</strong></div>
      <label class="row"><input type="checkbox" bind:checked={hideImages} /><span>Do not show images (Hides photos from external users behind Request for Images)</span></label>
      <button type="submit" class="btn">Publish Property</button>
    </form>
  {/if}
</div>

<style>
  .form-container { max-width: 780px; margin: 2rem auto; padding: 0 1.25rem; }
  h1 { color: var(--color-primary); }
  .card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
  label { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.84rem; font-weight: 600; }
  label.row { flex-direction: row; align-items: center; gap: 0.5rem; font-weight: 400; }
  input, select { padding: 0.6rem; border: 1px solid var(--color-border); border-radius: var(--radius-sm); }
  .calc { background: var(--color-accent-soft); color: var(--color-accent); padding: 0.65rem; border-radius: var(--radius-sm); font-size: 0.88rem; }
  .err { background: #fee2e2; color: #991b1b; padding: 0.65rem; border-radius: var(--radius-sm); font-weight: 600; }
  .btn { background: var(--color-primary); color: #fff; border: none; padding: 0.7rem; border-radius: var(--radius-sm); font-weight: 600; }
</style>
