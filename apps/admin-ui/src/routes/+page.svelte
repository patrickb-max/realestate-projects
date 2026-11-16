<script lang="ts">
  import { DEFAULT_HTL_THRESHOLDS_SQFT } from '@reprojects/constants';
  import Badge from '@reprojects/design-system/Badge.svelte';

  // Admin Console uses Username + Password authentication (separate from user portal OTP)
  let isAuthenticated = $state(false);
  let username = $state('admin@realestateprojects.in');
  let password = $state('Admin@2026');
  let authError = $state('');

  type AdminTab = 'htl' | 'projects' | 'enterprise' | 'subscriptions';
  let activeTab = $state<AdminTab>('htl');
  let toastMessage = $state<string | null>(null);

  function notify(msg: string) {
    toastMessage = msg;
    setTimeout(() => (toastMessage = null), 4000);
  }

  function handleAdminLogin(e: SubmitEvent) {
    e.preventDefault();
    if (!username.trim() || password.length < 6) {
      authError = 'Enter valid administrative credentials.';
      return;
    }
    authError = '';
    isAuthenticated = true;
  }

  // 1. Dynamic HTL Thresholds & Manual Unlock Valve
  let cityThresholds = $state<Record<string, number>>({ ...DEFAULT_HTL_THRESHOLDS_SQFT });
  let htlQueue = $state([
    {
      demandId: 'DM-880101',
      client: 'FinStack Technologies Pvt Ltd',
      city: 'Mumbai',
      carpetAreaSqFt: 8500,
      assignedRm: 'Himanshu',
      ageDays: 4,
      unlocked: false
    },
    {
      demandId: 'DM-880199',
      client: 'Apex Global Retail',
      city: 'Bengaluru',
      carpetAreaSqFt: 14000,
      assignedRm: 'Deepa',
      ageDays: 1,
      unlocked: false
    }
  ]);

  function unlockHtlToPublicPool(demandId: string) {
    htlQueue = htlQueue.map((item) =>
      item.demandId === demandId ? { ...item, unlocked: true } : item
    );
    notify(`HTL ${demandId} unlocked and pushed to matching external agents.`);
  }

  // 2. Backend-Only Project Creation & Developer/Operator Onboarding
  let projectsList = $state([
    { projectId: 'PJ-9001', name: 'Embassy One Commercial Tower', city: 'Bengaluru', category: 'premium', assetClass: 'office' },
    { projectId: 'PJ-9055', name: 'Nexus Skydeck F&B Promenade', city: 'Hyderabad', category: 'exclusive', assetClass: 'fnb' }
  ]);
  let newProjName = $state('');
  let newProjCity = $state('Bengaluru');
  let newProjCategory = $state<'standard' | 'premium' | 'exclusive'>('premium');
  let newProjAsset = $state<'office' | 'retail' | 'fnb' | 'managed_space'>('office');
  let newProjRera = $state('');

  function createProject(e: SubmitEvent) {
    e.preventDefault();
    // Enforce Premium Project scarcity cap (max 5 slots per city)
    if (newProjCategory === 'premium') {
      const cityPremiumCount = projectsList.filter(
        (p) => p.category === 'premium' && p.city === newProjCity
      ).length;
      if (cityPremiumCount >= 5) {
        notify(`Premium slot limit (5 max) reached for ${newProjCity}.`);
        return;
      }
    }
    const projectId = `PJ-${Math.floor(1000 + Math.random() * 9000)}`;
    projectsList = [
      { projectId, name: newProjName, city: newProjCity, category: newProjCategory, assetClass: newProjAsset },
      ...projectsList
    ];
    newProjName = '';
    newProjRera = '';
    notify(`Project ${projectId} created and published.`);
  }

  // 3. Enterprise Formats & Sub-User Listing Transfer
  let formats = $state([
    { id: 'FMT-01', brandName: 'Artisan Roast Coffee', formatName: 'Highstreet Cafe', carpetAreaSqFt: 2200, ocRequired: true },
    { id: 'FMT-02', brandName: 'Urban Thread Apparel', formatName: 'Mall Flagship', carpetAreaSqFt: 4500, ocRequired: true }
  ]);
  let formatBrand = $state('');
  let formatLabel = $state('');
  let formatArea = $state<number>(3000);

  let fromSubUser = $state('Himanshu (Exiting Rep)');
  let toSubUser = $state('Pradeepa (Active Rep)');

  function addBrandFormat(e: SubmitEvent) {
    e.preventDefault();
    if (/^format\s*\d+$/i.test(formatLabel.trim())) {
      notify('Generic names like "Format 1" are prohibited. Use an explicit model name (e.g., Drive-thru).');
      return;
    }
    formats = [
      { id: `FMT-0${formats.length + 1}`, brandName: formatBrand, formatName: formatLabel, carpetAreaSqFt: formatArea, ocRequired: true },
      ...formats
    ];
    formatBrand = '';
    formatLabel = '';
    notify('Enterprise Brand Format saved.');
  }

  // 4. Complimentary Agent Subscriptions & Deletion Queue
  let compAgentMobile = $state('');
  let compMonths = $state<number>(1);
  let deletionRequests = $state([
    { id: 'DEL-11', userName: 'Karan Mehta', role: 'Property Agent', mobile: '+91 98200 11223', submittedAt: 'Today' }
  ]);
</script>

{#if !isAuthenticated}
  <div class="login-shell">
    <form class="login-card" onsubmit={handleAdminLogin}>
      <span class="badge-top">CONTROL PANEL</span>
      <h1>RealEstate Projects Admin</h1>
      <p>Restricted administrative console for platform operations and governance.</p>
      {#if authError}<div class="err">{authError}</div>{/if}
      <label><span>Admin Username *</span><input type="text" required bind:value={username} /></label>
      <label><span>Password *</span><input type="password" required bind:value={password} /></label>
      <button type="submit" class="btn-primary">Sign In to Control Panel</button>
    </form>
  </div>
{:else}
  <div class="admin-shell">
    <header class="admin-bar">
      <div>
        <strong>RealEstate Projects · Control Panel</strong>
        <span class="sub">Logged in as {username}</span>
      </div>
      <div class="nav-tabs">
        <button type="button" class:active={activeTab === 'htl'} onclick={() => (activeTab = 'htl')}>HTL Controls</button>
        <button type="button" class:active={activeTab === 'projects'} onclick={() => (activeTab = 'projects')}>Projects &amp; Partners</button>
        <button type="button" class:active={activeTab === 'enterprise'} onclick={() => (activeTab = 'enterprise')}>Enterprise &amp; Formats</button>
        <button type="button" class:active={activeTab === 'subscriptions'} onclick={() => (activeTab = 'subscriptions')}>Subscriptions &amp; Deletions</button>
        <button type="button" class="logout-btn" onclick={() => (isAuthenticated = false)}>Logout</button>
      </div>
    </header>

    {#if toastMessage}
      <div class="toast">{toastMessage}</div>
    {/if}

    <main class="admin-main">
      {#if activeTab === 'htl'}
        <section class="panel-grid">
          <div class="card">
            <h2>City High-Ticket Lead (HTL) Thresholds</h2>
            <p class="muted">Tier-1 requirements exceeding these limits route exclusively to the internal team.</p>
            <div class="threshold-list">
              {#each Object.entries(cityThresholds) as [city, sqft]}
                <div class="thresh-row">
                  <strong>{city}</strong>
                  <div class="input-unit">
                    <input
                      type="number"
                      min="1000"
                      step="500"
                      value={sqft}
                      onchange={(e) => {
                        cityThresholds[city] = Number((e.currentTarget as HTMLInputElement).value);
                        notify(`Updated ${city} HTL threshold to ${cityThresholds[city].toLocaleString()} sq. ft.`);
                      }}
                    />
                    <span>sq. ft.</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <div class="card">
            <h2>Manual HTL Unlock Valve (3–4 Day SLA)</h2>
            <p class="muted">Push unserviced HTLs into the public relevancy pool for matching agents.</p>
            {#each htlQueue as item}
              <div class="item-box">
                <div class="item-top">
                  <span class="mono">{item.demandId}</span>
                  <Badge variant={item.unlocked ? 'success' : 'gold'}>
                    {item.unlocked ? 'Unlocked to Agents' : `Internal Only (${item.ageDays}d)`}
                  </Badge>
                </div>
                <strong>{item.client}</strong>
                <p>{item.city} · {item.carpetAreaSqFt.toLocaleString()} sq. ft. · RM: {item.assignedRm}</p>
                {#if !item.unlocked}
                  <button type="button" class="btn-accent" onclick={() => unlockHtlToPublicPool(item.demandId)}>
                    Unlock to Public Relevancy Pool
                  </button>
                {/if}
              </div>
            {/each}
          </div>
        </section>

      {:else if activeTab === 'projects'}
        <section class="panel-grid">
          <form class="card" onsubmit={createProject}>
            <h2>Add New Commercial Project</h2>
            <p class="muted">Developers and Managed Space Operators are onboarded exclusively here.</p>
            <label><span>Project Name *</span><input type="text" required bind:value={newProjName} /></label>
            <div class="two-col">
              <label><span>City *</span>
                <select bind:value={newProjCity}>
                  <option value="Bengaluru">Bengaluru</option><option value="Mumbai">Mumbai</option>
                  <option value="Hyderabad">Hyderabad</option><option value="Pune">Pune</option>
                </select>
              </label>
              <label><span>Category *</span>
                <select bind:value={newProjCategory}>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium (3–5 Slots/City)</option>
                  <option value="exclusive">Exclusive Mandate</option>
                </select>
              </label>
            </div>
            <div class="two-col">
              <label><span>Asset Class *</span>
                <select bind:value={newProjAsset}>
                  <option value="office">Office</option><option value="retail">Retail</option>
                  <option value="fnb">F&amp;B</option><option value="managed_space">Managed Space (Lease Only)</option>
                </select>
              </label>
              <label><span>RERA ID (Optional)</span><input type="text" bind:value={newProjRera} placeholder="PRM/KA/RERA/..." /></label>
            </div>
            <button type="submit" class="btn-primary">Create Project</button>
          </form>

          <div class="card">
            <h2>Active Platform Projects ({projectsList.length})</h2>
            {#each projectsList as proj}
              <div class="item-box">
                <div class="item-top">
                  <span class="mono">{proj.projectId}</span>
                  <Badge variant={proj.category === 'exclusive' ? 'primary' : proj.category === 'premium' ? 'gold' : 'neutral'}>
                    {proj.category.toUpperCase()}
                  </Badge>
                </div>
                <strong>{proj.name}</strong>
                <p>{proj.city} · {proj.assetClass.toUpperCase()}</p>
              </div>
            {/each}
          </div>
        </section>

      {:else if activeTab === 'enterprise'}
        <section class="panel-grid">
          <form class="card" onsubmit={addBrandFormat}>
            <h2>Configure Enterprise Brand Format</h2>
            <p class="muted">Pre-populates constant specs when Enterprise users post demands.</p>
            <label><span>Brand Name *</span><input type="text" required bind:value={formatBrand} placeholder="e.g., McDonald's" /></label>
            <label><span>Explicit Format Model *</span><input type="text" required bind:value={formatLabel} placeholder="e.g., Drive-thru or Food Court" /></label>
            <label><span>Default Carpet Area (sq. ft.) *</span><input type="number" min="100" required bind:value={formatArea} /></label>
            <button type="submit" class="btn-primary">Save Format Template</button>

            <hr />
            <h3>Sub-User Listing Ownership Transfer</h3>
            <p class="muted">Mandatory before deleting an exiting brand representative's profile.</p>
            <div class="two-col">
              <label><span>From User</span><input type="text" bind:value={fromSubUser} /></label>
              <label><span>To Active User</span><input type="text" bind:value={toSubUser} /></label>
            </div>
            <button type="button" class="btn-accent" onclick={() => notify(`All active demands transferred from ${fromSubUser} to ${toSubUser}.`)}>
              Transfer All Demands
            </button>
          </form>

          <div class="card">
            <h2>Saved Brand Formats ({formats.length})</h2>
            {#each formats as f}
              <div class="item-box">
                <div class="item-top"><span class="mono">{f.id}</span><Badge variant="primary">{f.carpetAreaSqFt} sq. ft.</Badge></div>
                <strong>{f.brandName} — {f.formatName}</strong>
              </div>
            {/each}
          </div>
        </section>

      {:else if activeTab === 'subscriptions'}
        <section class="panel-grid">
          <form class="card" onsubmit={(e) => { e.preventDefault(); notify(`Granted ${compMonths} month(s) zero-charge testing plan to ${compAgentMobile}.`); compAgentMobile = ''; }}>
            <h2>Grant Complimentary Agent Testing Access</h2>
            <p class="muted">Zero-charge testing subscription; reverts to payable status upon expiry.</p>
            <label><span>Agent Mobile Number *</span><input type="tel" required bind:value={compAgentMobile} placeholder="+91 98765 43210" /></label>
            <label><span>Duration (Months) *</span><input type="number" min="1" max="12" required bind:value={compMonths} /></label>
            <button type="submit" class="btn-primary">Activate Zero-Charge Plan</button>
          </form>

          <div class="card">
            <h2>Account Deletion Requests ({deletionRequests.length})</h2>
            <p class="muted">Manual verification required; permanently removes associated inventory upon execution.</p>
            {#each deletionRequests as req}
              <div class="item-box">
                <strong>{req.userName} ({req.role})</strong>
                <p>{req.mobile} · Submitted: {req.submittedAt}</p>
                <button
                  type="button"
                  class="btn-danger"
                  onclick={() => {
                    deletionRequests = deletionRequests.filter((r) => r.id !== req.id);
                    notify(`Executed permanent profile & inventory deletion for ${req.userName}.`);
                  }}
                >
                  Verify &amp; Permanently Delete
                </button>
              </div>
            {:else}
              <p class="muted">No pending account deletion requests.</p>
            {/each}
          </div>
        </section>
      {/if}
    </main>
  </div>
{/if}

<style>
  .login-shell { min-height: 100vh; display: grid; place-items: center; padding: 1rem; background: #0f294a; }
  .login-card { background: var(--color-surface); width: min(420px, 100%); padding: 2rem; border-radius: var(--radius-lg); display: flex; flex-direction: column; gap: 0.9rem; }
  .badge-top { align-self: flex-start; background: #dbeafe; color: var(--color-primary); font-size: 0.72rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: var(--radius-sm); }
  .login-card h1 { margin: 0; font-size: 1.35rem; color: var(--color-primary); }
  .login-card p { margin: 0; font-size: 0.85rem; color: var(--color-text-muted); }

  .admin-bar { background: var(--color-primary); color: #fff; padding: 0.85rem 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
  .admin-bar .sub { display: block; font-size: 0.78rem; color: #cbd5e1; }
  .nav-tabs { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .nav-tabs button { background: rgba(255, 255, 255, 0.12); color: #fff; border: none; padding: 0.45rem 0.85rem; border-radius: var(--radius-sm); font-size: 0.84rem; font-weight: 600; }
  .nav-tabs button.active { background: #fff; color: var(--color-primary); }
  .logout-btn { background: rgba(220, 38, 38, 0.85) !important; }

  .toast { background: var(--color-success-bg); color: var(--color-success); padding: 0.75rem 1.5rem; font-weight: 600; text-align: center; border-bottom: 1px solid #86efac; }
  .admin-main { max-width: 1180px; margin: 2rem auto; padding: 0 1.5rem; }
  .panel-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
  @media (max-width: 820px) { .panel-grid { grid-template-columns: 1fr; } }

  .card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 1.5rem; display: flex; flex-direction: column; gap: 0.85rem; }
  .card h2, .card h3 { margin: 0; color: var(--color-primary); }
  .muted { margin: 0; font-size: 0.84rem; color: var(--color-text-muted); }
  label { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.82rem; font-weight: 600; }
  input, select { padding: 0.55rem 0.75rem; border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: 0.9rem; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

  .threshold-list { display: flex; flex-direction: column; gap: 0.55rem; }
  .thresh-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; background: var(--color-bg); border-radius: var(--radius-sm); }
  .input-unit { display: flex; align-items: center; gap: 0.4rem; }
  .input-unit input { width: 110px; text-align: right; }

  .item-box { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0.9rem; display: flex; flex-direction: column; gap: 0.35rem; }
  .item-box p { margin: 0; font-size: 0.84rem; color: var(--color-text-muted); }
  .item-top { display: flex; justify-content: space-between; align-items: center; }
  .mono { font-family: monospace; font-weight: 700; color: var(--color-primary); }

  .btn-primary { background: var(--color-primary); color: #fff; border: none; padding: 0.65rem 1rem; border-radius: var(--radius-sm); font-weight: 600; }
  .btn-accent { background: var(--color-accent); color: #fff; border: none; padding: 0.55rem 0.9rem; border-radius: var(--radius-sm); font-weight: 600; align-self: flex-start; }
  .btn-danger { background: var(--color-alert-dot); color: #fff; border: none; padding: 0.5rem 0.85rem; border-radius: var(--radius-sm); font-weight: 600; align-self: flex-start; }
  .err { background: #fee2e2; color: #991b1b; padding: 0.6rem; border-radius: var(--radius-sm); font-size: 0.84rem; font-weight: 600; }
  hr { border: 0; border-top: 1px solid var(--color-border); width: 100%; margin: 0.4rem 0; }
</style>
