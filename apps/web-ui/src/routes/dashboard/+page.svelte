<script lang="ts">
  import { session } from '$lib/stores/session.svelte';
  import { marketplace } from '$lib/stores/marketplace.svelte';
  import Badge from '@reprojects/design-system/Badge.svelte';
  import SlideDrawer from '@reprojects/design-system/SlideDrawer.svelte';

  let drawerMode = $state<'none' | 'leads' | 'tasks' | 'htl'>('none');
  let kdScope = $state<'my' | 'all'>('my');

  // Red-dot relevancy priority sorting: listings with unread matches float to the top
  let prioritizedProperties = $derived(
    [...marketplace.properties].sort((a, b) => Number(b.hasUnreadMatches) - Number(a.hasUnreadMatches))
  );

  let prioritizedDemands = $derived(
    [...marketplace.demands].sort((a, b) => Number(b.hasUnreadMatches) - Number(a.hasUnreadMatches))
  );

  let htlDemands = $derived(marketplace.demands.filter((d) => d.isHighTicketLead));
  let pendingTasksCount = $derived(marketplace.inboundLeads.filter((l) => l.status === 'pending').length);
</script>

<div class="dash-wrap">
  <header class="dash-head">
    <div>
      <h1>Live Impromptu Dashboard</h1>
      <p>{session.user ? `${session.user.name} · ${session.user.role.toUpperCase()}` : 'Sign in to manage your listings & leads'}</p>
    </div>

    {#if session.isInternalTeam}
      <div class="seg-toggle">
        <button type="button" class:active={kdScope === 'my'} onclick={() => (kdScope = 'my')}>My Portfolio</button>
        <button type="button" class:active={kdScope === 'all'} onclick={() => (kdScope = 'all')}>Overall (REP Team)</button>
      </div>
    {/if}
  </header>

  <div class="kpi-grid">
    <button type="button" class="kpi-card" onclick={() => (drawerMode = 'leads')}>
      <span class="kpi-label">Leads &amp; Contact Requests</span>
      <strong class="kpi-val">{marketplace.inboundLeads.length}</strong>
      <Badge variant="danger" dot>{pendingTasksCount} Pending Action</Badge>
    </button>

    <button type="button" class="kpi-card" onclick={() => (drawerMode = 'tasks')}>
      <span class="kpi-label">My Tasks &amp; Image Approvals</span>
      <strong class="kpi-val">{pendingTasksCount}</strong>
      <span class="kpi-sub">72h SLA active on Brand requests</span>
    </button>

    {#if session.isInternalTeam}
      <button type="button" class="kpi-card kpi-card--gold" onclick={() => (drawerMode = 'htl')}>
        <span class="kpi-label">High-Ticket Leads (HTL)</span>
        <strong class="kpi-val">{htlDemands.length}</strong>
        <span class="kpi-sub">Exclusive internal routing</span>
      </button>
    {/if}
  </div>

  <section class="feed-section">
    <h2>Active Properties (Relevancy Matches Prioritized)</h2>
    <div class="list-stack">
      {#each prioritizedProperties as prop}
        <div class="row-card">
          <div>
            <div class="row-top">
              <span class="id">{prop.propertyId}</span>
              <Badge variant="primary">{prop.assetClass.toUpperCase()}</Badge>
              {#if prop.hasUnreadMatches}
                <Badge variant="danger" dot>{prop.relevancyCount} New Relevancies</Badge>
              {/if}
            </div>
            <strong>{prop.displayTitle}</strong> — {prop.primaryLocation}, {prop.city} ({prop.carpetAreaSqFt.toLocaleString()} sq. ft.)
          </div>
          <div class="row-meta">₹{prop.quotedRentInr.toLocaleString()}/mo</div>
        </div>
      {/each}
    </div>
  </section>

  <section class="feed-section">
    <h2>Active Demands</h2>
    <div class="list-stack">
      {#each prioritizedDemands as dem}
        <div class="row-card">
          <div>
            <div class="row-top">
              <span class="id">{dem.demandId}</span>
              <Badge variant="neutral">{dem.assetClass.toUpperCase()}</Badge>
              {#if dem.isHighTicketLead}<Badge variant="gold">HTL Exclusive</Badge>{/if}
              {#if dem.hasUnreadMatches}<Badge variant="danger" dot>{dem.relevancyCount} Matches</Badge>{/if}
            </div>
            <strong>{dem.posterDisplayName}</strong> · {dem.primaryLocation}, {dem.city} ({dem.carpetAreaSqFt.toLocaleString()} sq. ft.)
          </div>
          {#if session.isInternalTeam}
            <button type="button" class="btn-sm" onclick={() => marketplace.recordHtlView(dem.demandId)}>
              View Requirement ({dem.viewedByTeam.length} views logged)
            </button>
          {/if}
        </div>
      {/each}
    </div>
  </section>
</div>

<SlideDrawer
  open={drawerMode !== 'none'}
  title={drawerMode === 'htl' ? 'High-Ticket Leads Accountability Log' : 'Leads & Action Queue'}
  subtitle="Accept or reject Brand contact requests & hidden image requests"
  onClose={() => (drawerMode = 'none')}
>
  {#if drawerMode === 'htl'}
    {#each htlDemands as htl}
      <div class="drawer-item">
        <strong>{htl.demandId} — {htl.posterDisplayName} ({htl.city})</strong>
        <p>{htl.carpetAreaSqFt.toLocaleString()} sq. ft. · Mobile: {htl.posterMobile}</p>
        <p class="audit">Viewed by: {htl.viewedByTeam.length ? htl.viewedByTeam.map((v) => `${v.name} (${v.viewedAt})`).join(', ') : 'No (Unviewed)'}</p>
      </div>
    {/each}
  {:else}
    {#each marketplace.inboundLeads as lead}
      <div class="drawer-item">
        <div class="row-top">
          <strong>{lead.requesterName}</strong>
          <Badge variant={lead.status === 'accepted' ? 'success' : lead.status === 'rejected' ? 'danger' : 'warning'}>{lead.status.toUpperCase()}</Badge>
        </div>
        <p>{lead.requesterRole} · Listing: <code>{lead.listingId}</code> · {lead.timestamp}</p>
        {#if lead.status === 'pending'}
          <div class="btn-row">
            <button type="button" class="btn-accept" onclick={() => marketplace.actionLead(lead.id, 'accepted')}>Accept</button>
            <button type="button" class="btn-reject" onclick={() => marketplace.actionLead(lead.id, 'rejected')}>Reject</button>
          </div>
        {:else if lead.status === 'accepted'}
          <p class="phone-ok">📞 Contact Unlocked: {lead.requesterMobile}</p>
        {/if}
      </div>
    {/each}
  {/if}
</SlideDrawer>

<style>
  .dash-wrap { max-width: 1140px; margin: 2rem auto; padding: 0 1.5rem; }
  .dash-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
  .dash-head h1 { margin: 0; color: var(--color-primary); }
  .dash-head p { margin: 0.2rem 0 0; color: var(--color-text-muted); font-size: 0.88rem; }
  .seg-toggle { display: flex; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-pill); padding: 0.2rem; }
  .seg-toggle button { border: none; background: none; padding: 0.4rem 0.9rem; border-radius: var(--radius-pill); font-weight: 600; font-size: 0.84rem; }
  .seg-toggle button.active { background: var(--color-primary); color: #fff; }
  .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
  .kpi-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1.25rem; text-align: left; display: flex; flex-direction: column; gap: 0.4rem; }
  .kpi-card:hover { border-color: var(--color-primary); background: var(--color-card-hover-tint); }
  .kpi-card--gold { border-color: var(--color-premium-gold); }
  .kpi-label { font-size: 0.84rem; color: var(--color-text-muted); font-weight: 600; }
  .kpi-val { font-size: 1.8rem; color: var(--color-primary); }
  .kpi-sub { font-size: 0.78rem; color: var(--color-text-muted); }
  .feed-section { margin-bottom: 2rem; }
  .feed-section h2 { font-size: 1.15rem; color: var(--color-primary); margin-bottom: 0.85rem; }
  .list-stack { display: flex; flex-direction: column; gap: 0.75rem; }
  .row-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1rem 1.2rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
  .row-top { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem; flex-wrap: wrap; }
  .id { font-family: monospace; font-weight: 700; color: var(--color-primary); }
  .row-meta { font-weight: 700; color: var(--color-primary); }
  .btn-sm { background: var(--color-primary); color: #fff; border: none; padding: 0.45rem 0.85rem; border-radius: var(--radius-sm); font-size: 0.82rem; font-weight: 600; }
  .drawer-item { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 0.85rem; }
  .drawer-item p { margin: 0.35rem 0; font-size: 0.85rem; color: var(--color-text-muted); }
  .audit { font-weight: 600; color: var(--color-primary) !important; }
  .btn-row { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
  .btn-accept { background: var(--color-success); color: #fff; border: none; padding: 0.4rem 0.9rem; border-radius: var(--radius-sm); font-weight: 600; }
  .btn-reject { background: var(--color-alert-dot); color: #fff; border: none; padding: 0.4rem 0.9rem; border-radius: var(--radius-sm); font-weight: 600; }
  .phone-ok { color: var(--color-success) !important; font-weight: 700; }
</style>
