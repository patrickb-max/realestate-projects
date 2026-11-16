<script lang="ts">
  import { session } from '$lib/stores/session.svelte';
  import { SUBSCRIPTION_PRICING_INR, type AssetClass } from '@reprojects/constants';

  let retailFnbSelected = $state(true);
  let officeSelected = $state(true);
  let selectedMetros = $state<string[]>(['Bengaluru']);
  let selectedNonMetros = $state<string[]>([]);
  let panIndia = $state(false);
  let activatedSuccess = $state(false);

  const METROS = ['Mumbai', 'Delhi NCR', 'Bengaluru', 'Chennai', 'Kolkata', 'Pune', 'Hyderabad'];
  const NON_METROS = ['Jaipur', 'Indore', 'Coimbatore', 'Kochi', 'Chandigarh', 'Ahmedabad'];

  function toggleItem(list: string[], item: string): string[] {
    return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
  }

  let bundleCount = $derived(Number(retailFnbSelected) + Number(officeSelected));

  let subtotalInr = $derived.by(() => {
    if (bundleCount === 0) return 0;
    if (panIndia) return bundleCount * SUBSCRIPTION_PRICING_INR.PAN_INDIA_SINGLE_BUNDLE;
    const metroTotal = selectedMetros.length * SUBSCRIPTION_PRICING_INR.METRO_SINGLE_BUNDLE * bundleCount;
    const nonMetroTotal = selectedNonMetros.length * SUBSCRIPTION_PRICING_INR.NON_METRO_SINGLE_BUNDLE * bundleCount;
    return metroTotal + nonMetroTotal;
  });

  let gstInr = $derived(Math.round(subtotalInr * SUBSCRIPTION_PRICING_INR.GST_RATE));
  let totalInr = $derived(subtotalInr + gstInr);

  function confirmSubscription() {
    if (!session.user) { session.openLogin('Activate Pro Agent Subscription'); return; }
    const classes: AssetClass[] = [
      ...(retailFnbSelected ? (['retail', 'fnb'] as AssetClass[]) : []),
      ...(officeSelected ? (['office'] as AssetClass[]) : [])
    ];
    session.activateAgentSubscription(panIndia ? [...METROS, ...NON_METROS] : [...selectedMetros, ...selectedNonMetros], classes);
    activatedSuccess = true;
  }
</script>

<div class="sub-page">
  <h1>Agent Pro Membership Plans</h1>
  <p class="sub">Unlimited property &amp; demand postings, unlimited contact unlocks, and real-time WhatsApp alerts (30-day cycle).</p>

  <div class="sub-grid">
    <div class="config-card">
      <h3>1. Choose Asset Class Bundles</h3>
      <label class="check"><input type="checkbox" bind:checked={retailFnbSelected} /><span>Retail &amp; F&amp;B Bundle</span></label>
      <label class="check"><input type="checkbox" bind:checked={officeSelected} /><span>Office Bundle</span></label>

      <h3>2. Choose City Coverage</h3>
      <label class="check"><input type="checkbox" bind:checked={panIndia} /><span><strong>PAN India</strong> (₹5,000 / bundle / month)</span></label>

      {#if !panIndia}
        <p class="tier-title">Metro Cities (₹1,000 / bundle / city)</p>
        <div class="chip-grid">
          {#each METROS as c}
            <button type="button" class:on={selectedMetros.includes(c)} onclick={() => (selectedMetros = toggleItem(selectedMetros, c))}>{c}</button>
          {/each}
        </div>

        <p class="tier-title">Non-Metro Cities (₹750 / bundle / city)</p>
        <div class="chip-grid">
          {#each NON_METROS as c}
            <button type="button" class:on={selectedNonMetros.includes(c)} onclick={() => (selectedNonMetros = toggleItem(selectedNonMetros, c))}>{c}</button>
          {/each}
        </div>
      {/if}
    </div>

    <div class="summary-card">
      <h3>Invoice Summary</h3>
      <div class="line"><span>Plan Subtotal (30 Days)</span><strong>₹{subtotalInr.toLocaleString()}</strong></div>
      <div class="line"><span>GST (18%)</span><strong>₹{gstInr.toLocaleString()}</strong></div>
      <hr />
      <div class="line total"><span>Total / Month</span><strong>₹{totalInr.toLocaleString()}</strong></div>

      {#if activatedSuccess}
        <div class="ok-box">✓ Pro Member Plan Activated! GST Invoice generated.</div>
      {:else}
        <button type="button" class="btn-pay" disabled={totalInr === 0} onclick={confirmSubscription}>Confirm &amp; Pay (Razorpay)</button>
      {/if}
    </div>
  </div>
</div>

<style>
  .sub-page { max-width: 1020px; margin: 2rem auto; padding: 0 1.25rem; }
  h1 { margin: 0; color: var(--color-primary); }
  .sub { color: var(--color-text-muted); margin-bottom: 1.5rem; }
  .sub-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 1.5rem; }
  .config-card, .summary-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 1.5rem; }
  .check { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.6rem; font-weight: 500; }
  .tier-title { font-size: 0.84rem; font-weight: 700; color: var(--color-primary); margin: 1rem 0 0.5rem; }
  .chip-grid { display: flex; flex-wrap: wrap; gap: 0.45rem; }
  .chip-grid button { background: var(--color-bg); border: 1px solid var(--color-border); padding: 0.35rem 0.8rem; border-radius: var(--radius-pill); font-size: 0.82rem; }
  .chip-grid button.on { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
  .line { display: flex; justify-content: space-between; margin: 0.65rem 0; font-size: 0.92rem; }
  .total { font-size: 1.15rem; color: var(--color-primary); }
  .btn-pay { width: 100%; margin-top: 1rem; background: var(--color-accent); color: #fff; border: none; padding: 0.75rem; border-radius: var(--radius-sm); font-weight: 700; }
  .btn-pay:disabled { opacity: 0.5; cursor: not-allowed; }
  .ok-box { margin-top: 1rem; background: var(--color-success-bg); color: var(--color-success); padding: 0.8rem; border-radius: var(--radius-sm); font-weight: 600; }
</style>
