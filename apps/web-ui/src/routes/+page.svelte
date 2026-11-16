<script lang="ts">
  import { session } from '$lib/stores/session.svelte';
  import { marketplace } from '$lib/stores/marketplace.svelte';
  import type { AssetClass } from '@reprojects/constants';
  import Badge from '@reprojects/design-system/Badge.svelte';

  const HERO_SLIDES = [
    {
      title: 'Institutional Commercial Real Estate, Matched Intelligently',
      subtitle: 'Discover verified Office, Retail, F&B, and Managed Spaces across India’s prime business districts.'
    },
    {
      title: 'Direct Enterprise & Brand Expansion Requirements',
      subtitle: 'Connect transparently with verified retail chains, F&B operators, and commercial landlords.'
    },
    {
      title: 'Mandated Exclusive Commercial Projects & Managed Campuses',
      subtitle: 'Curated Grade-A developments and turnkey managed offices backed by dedicated relationship managers.'
    }
  ];

  let activeSlide = $state(0);
  $effect(() => {
    const timer = setInterval(() => { activeSlide = (activeSlide + 1) % HERO_SLIDES.length; }, 5000);
    return () => clearInterval(timer);
  });

  let searchBuckets = $state({ properties: true, projects: true, demands: false });
  let selectedAssetClass = $state<AssetClass>('office');
  let transactionType = $state<'lease' | 'sale'>('lease');
  let localityQuery = $state('');
  let minAreaFilter = $state<number | ''>('');
  let maxAreaFilter = $state<number | ''>('');

  function toggleBucket(bucket: 'properties' | 'projects' | 'demands') {
    if (bucket === 'demands') {
      searchBuckets = { properties: false, projects: false, demands: true };
    } else {
      const next = { ...searchBuckets, demands: false, [bucket]: !searchBuckets[bucket] };
      if (!next.properties && !next.projects) next.properties = true;
      searchBuckets = next;
    }
  }

  function runSearch(e: SubmitEvent) {
    e.preventDefault();
    marketplace.recordSearch({
      city: session.selectedCity,
      location: localityQuery || 'All Localities',
      assetClass: selectedAssetClass,
      transactionType
    });
  }

  let cityProperties = $derived(
    marketplace.properties.filter((p) => {
      const cityMatch = p.city.toLowerCase() === session.selectedCity.toLowerCase();
      const assetMatch = p.assetClass === selectedAssetClass;
      const locMatch =
        !localityQuery.trim() ||
        p.primaryLocation.toLowerCase().includes(localityQuery.toLowerCase()) ||
        p.displayTitle.toLowerCase().includes(localityQuery.toLowerCase()) ||
        p.propertyId.toLowerCase().includes(localityQuery.toLowerCase());
      const minOk = minAreaFilter === '' || p.carpetAreaSqFt >= Number(minAreaFilter);
      const maxOk = maxAreaFilter === '' || p.carpetAreaSqFt <= Number(maxAreaFilter);
      return cityMatch && assetMatch && locMatch && minOk && maxOk;
    })
  );

  let newPropertiesLast7Days = $derived(
    marketplace.properties.filter(
      (p) =>
        p.city.toLowerCase() === session.selectedCity.toLowerCase() &&
        Date.now() - new Date(p.createdAt).getTime() <= 7 * 24 * 60 * 60 * 1000
    )
  );

  let premiumProjects = $derived(marketplace.projects.filter((p) => p.category === 'premium'));
  let premiumCities = $derived(Array.from(new Set(premiumProjects.map((p) => p.city))));
  let activePremiumCity = $state<string>('Bengaluru');

  $effect(() => {
    if (premiumCities.length > 0 && !premiumCities.includes(activePremiumCity)) {
      activePremiumCity = premiumCities[0];
    }
  });

  let visiblePremiumProjects = $derived(premiumProjects.filter((p) => p.city === activePremiumCity));
  let exclusiveProjects = $derived(marketplace.projects.filter((p) => p.category === 'exclusive'));

  let callbackMobile = $state('');
  let callbackName = $state('');
  let callbackEmail = $state('');
  let callbackSubmitted = $state(false);
</script>

<div class="landing-page">
  {#if marketplace.gateAlert}
    <div class="gate-banner" role="alert">
      <span>{marketplace.gateAlert}</span>
      <div>
        <a href="/subscription" class="btn-small">View Plans</a>
        <button type="button" onclick={() => (marketplace.gateAlert = null)}>✕</button>
      </div>
    </div>
  {/if}

  <section class="hero-section">
    <div class="hero-content">
      <div class="carousel-dots">
        {#each HERO_SLIDES as _, idx}
          <button type="button" class="dot" class:dot--active={idx === activeSlide} onclick={() => (activeSlide = idx)} aria-label="Slide {idx + 1}"></button>
        {/each}
      </div>
      <h1>{HERO_SLIDES[activeSlide].title}</h1>
      <p class="hero-sub">{HERO_SLIDES[activeSlide].subtitle}</p>

      <form class="search-card" onsubmit={runSearch}>
        <div class="bucket-bar">
          <button type="button" class="bucket-chip" class:bucket-chip--active={searchBuckets.properties} onclick={() => toggleBucket('properties')}>✓ Properties</button>
          <button type="button" class="bucket-chip" class:bucket-chip--active={searchBuckets.projects} onclick={() => toggleBucket('projects')}>✓ Projects</button>
          {#if session.canExploreDemands}
            <button type="button" class="bucket-chip" class:bucket-chip--active={searchBuckets.demands} onclick={() => toggleBucket('demands')}>Demands (Internal Only)</button>
          {/if}
        </div>

        <div class="search-grid">
          <div class="field-group">
            <label>City *</label>
            <select bind:value={session.selectedCity}>
              <option value="Bengaluru">Bengaluru</option><option value="Mumbai">Mumbai</option>
              <option value="Delhi NCR">Delhi NCR</option><option value="Hyderabad">Hyderabad</option>
              <option value="Pune">Pune</option><option value="Chennai">Chennai</option>
            </select>
          </div>
          <div class="field-group">
            <label>Asset Class *</label>
            <select bind:value={selectedAssetClass}>
              <option value="office">Office (Default)</option><option value="retail">Retail</option>
              <option value="fnb">F&amp;B</option><option value="managed_space">Managed Space</option>
            </select>
          </div>
          <div class="field-group">
            <label>Transaction</label>
            <select bind:value={transactionType}><option value="lease">Lease</option><option value="sale">Sales</option></select>
          </div>
          <div class="field-group field-group--wide">
            <label>Locality / Project / Property ID</label>
            <input type="search" placeholder="Enter locality, project name, or PR-ID..." bind:value={localityQuery} />
          </div>
          <button type="submit" class="search-submit">Search</button>
        </div>

        <div class="range-row">
          <span>Carpet Area (sq. ft.):</span>
          <input type="number" placeholder="Min sq. ft." bind:value={minAreaFilter} />
          <span>to</span>
          <input type="number" placeholder="Max sq. ft." bind:value={maxAreaFilter} />
        </div>
      </form>
    </div>
  </section>

  {#if newPropertiesLast7Days.length > 0}
    <section class="page-section">
      <div class="section-head">
        <div><h2>New Properties in {session.selectedCity}</h2><p>Added in the last 7 days</p></div>
        <Badge variant="success">Fresh This Week</Badge>
      </div>
      <div class="cards-grid">
        {#each newPropertiesLast7Days as prop}
          <article class="listing-card">
            <div class="card-media"><img src={prop.thumbnailUrl} alt={prop.displayTitle} /><span class="card-tag">{prop.assetClass.toUpperCase()}</span></div>
            <div class="card-body">
              <div class="card-meta"><span class="id-chip">{prop.propertyId}</span><span>{prop.carpetAreaSqFt.toLocaleString()} sq. ft.</span></div>
              <h3>{prop.displayTitle}</h3>
              <p class="loc-text">{prop.primaryLocation}, {prop.city}</p>
              <p class="price-text">₹{prop.quotedRentInr.toLocaleString()}/mo · ₹{prop.ratePerSqFtInr}/sq. ft.</p>
            </div>
          </article>
        {/each}
      </div>
    </section>
  {/if}

  {#if premiumProjects.length > 0}
    <section class="page-section">
      <div class="section-head">
        <div><h2>Premium Projects</h2><p>Featured developer hubs across active cities</p></div>
        <div class="tab-strip">
          {#each premiumCities as cityTab}
            <button type="button" class="tab-btn" class:tab-btn--active={activePremiumCity === cityTab} onclick={() => (activePremiumCity = cityTab)}>{cityTab}</button>
          {/each}
        </div>
      </div>
      <div class="cards-grid">
        {#each visiblePremiumProjects as proj}
          {@const interestedDate = marketplace.projectInterests[proj.projectId]}
          <article class="listing-card">
            <div class="card-media"><img src={proj.thumbnailUrl} alt={proj.projectName} /><span class="card-tag card-tag--gold">★ PREMIUM</span></div>
            <div class="card-body">
              <div class="card-meta"><span class="id-chip">{proj.projectId}</span><span>{proj.projectType}</span></div>
              <h3>{proj.projectName}</h3>
              <p class="loc-text">{proj.location}, {proj.city}</p>
              {#if interestedDate}
                <button type="button" class="btn-interested" disabled>✓ Interest Shown on {interestedDate}</button>
              {:else}
                <button type="button" class="btn-card-primary" onclick={() => marketplace.showProjectInterest(proj)}>Show Interest</button>
              {/if}
            </div>
          </article>
        {/each}
      </div>
    </section>
  {/if}

  <section class="page-section page-section--tinted">
    <div class="section-head">
      <div><h2>Exclusive Mandated Projects</h2><p>Nationwide flagship developments managed exclusively by RealEstate Projects</p></div>
      <Badge variant="gold">Exclusive Mandate</Badge>
    </div>
    <div class="cards-grid">
      {#each exclusiveProjects as proj}
        {@const interestedDate = marketplace.projectInterests[proj.projectId]}
        <article class="listing-card">
          <div class="card-media"><img src={proj.thumbnailUrl} alt={proj.projectName} /><span class="card-tag card-tag--primary">EXCLUSIVE</span></div>
          <div class="card-body">
            <div class="card-meta"><span class="id-chip">{proj.projectId}</span><span>{proj.city}</span></div>
            <h3>{proj.projectName}</h3>
            <p class="loc-text">{proj.location}</p>
            {#if interestedDate}
              <button type="button" class="btn-interested" disabled>✓ Interest Shown on {interestedDate}</button>
            {:else}
              <button type="button" class="btn-card-primary" onclick={() => marketplace.showProjectInterest(proj)}>Show Interest</button>
            {/if}
          </div>
        </article>
      {/each}
    </div>
  </section>

  <section class="page-section">
    <div class="section-head">
      <div><h2>Explore Properties in {session.selectedCity}</h2><p>Showing {selectedAssetClass.toUpperCase()} spaces available for Lease</p></div>
    </div>
    <div class="cards-grid">
      {#each cityProperties as prop}
        {@const revealedPhone = marketplace.unlockedContacts[prop.propertyId]}
        {@const imgReqStatus = marketplace.imageRequests[prop.propertyId]}
        {@const showActualPhoto = !prop.hideImages || session.isInternalTeam || imgReqStatus === 'accepted'}

        <article class="listing-card">
          <div class="card-media" class:card-media--masked={!showActualPhoto}>
            <img src={prop.thumbnailUrl} alt={prop.displayTitle} />
            {#if prop.hideImages && session.isInternalTeam}
              <div class="privacy-overlay privacy-overlay--internal">Hidden to others</div>
            {:else if !showActualPhoto}
              <div class="privacy-overlay">
                <span>Images Hidden by Lister</span>
                {#if imgReqStatus === 'pending'}
                  <Badge variant="warning">Image Request Pending</Badge>
                {:else}
                  <button type="button" class="btn-req-img" onclick={() => marketplace.requestPropertyImages(prop)}>Request for Images</button>
                {/if}
              </div>
            {/if}
          </div>
          <div class="card-body">
            <div class="card-meta">
              <span class="id-chip">{prop.propertyId}</span>
              <span>Posted by: <strong>{session.isInternalTeam && prop.internalPosterName ? `${prop.ownerDisplayName} (${prop.internalPosterName})` : prop.ownerDisplayName}</strong></span>
            </div>
            <h3>{prop.displayTitle}</h3>
            <p class="loc-text">{prop.primaryLocation}, {prop.city}</p>
            <p class="price-text">₹{prop.quotedRentInr.toLocaleString()}/mo · {prop.carpetAreaSqFt.toLocaleString()} sq. ft.</p>
            {#if revealedPhone}
              <div class="revealed-phone">📞 {revealedPhone} (Shared via WhatsApp)</div>
            {:else}
              <button type="button" class="btn-card-primary" onclick={() => marketplace.unlockPropertyPhone(prop)}>View Phone Number</button>
            {/if}
          </div>
        </article>
      {:else}
        <div class="empty-state"><p>No active {selectedAssetClass.toUpperCase()} properties match your filter in {session.selectedCity}.</p></div>
      {/each}
    </div>
  </section>

  <section class="about-callback">
    <div class="about-copy">
      <h2>About RealEstate Projects</h2>
      <p>Commercial real estate intelligence connecting Brands, Corporate Occupiers, Agents, and Managed Workspace Operators.</p>
    </div>
    <form class="callback-card" onsubmit={(e) => { e.preventDefault(); callbackSubmitted = true; }}>
      <h3>Request a Callback</h3>
      {#if callbackSubmitted}
        <div class="callback-success">✓ Callback requested for <strong>{callbackMobile}</strong>.</div>
      {:else}
        <label><span>Mobile Number *</span><input type="tel" maxlength="10" required placeholder="10-digit mobile number" bind:value={callbackMobile} /></label>
        <label><span>Name (Optional)</span><input type="text" bind:value={callbackName} /></label>
        <label><span>Official Email (Optional)</span><input type="email" bind:value={callbackEmail} /></label>
        <button type="submit" class="btn-card-primary">Request Callback</button>
      {/if}
    </form>
  </section>
</div>

<style>
  .gate-banner { background: #fee2e2; color: #991b1b; padding: 0.75rem 1.5rem; display: flex; justify-content: space-between; align-items: center; font-weight: 600; font-size: 0.9rem; }
  .btn-small { background: var(--color-primary); color: #fff; text-decoration: none; padding: 0.35rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.82rem; margin-right: 0.5rem; }
  .hero-section { background: linear-gradient(135deg, #0f294a 0%, #1d4375 100%); color: #fff; padding: 3rem 1.5rem 3.5rem; }
  .hero-content { max-width: 1140px; margin: 0 auto; }
  .carousel-dots { display: flex; gap: 0.45rem; margin-bottom: 1rem; }
  .dot { width: 24px; height: 4px; border: none; border-radius: 2px; background: rgba(255, 255, 255, 0.35); }
  .dot--active { background: var(--color-accent); width: 38px; }
  .hero-content h1 { margin: 0; font-size: clamp(1.6rem, 3vw, 2.3rem); max-width: 780px; }
  .hero-sub { margin: 0.6rem 0 1.75rem; color: #dbeafe; max-width: 680px; }
  .search-card { background: var(--color-surface); color: var(--color-text-main); border-radius: var(--radius-lg); padding: 1.25rem; box-shadow: var(--shadow-md); }
  .bucket-bar { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
  .bucket-chip { background: var(--color-bg); border: 1px solid var(--color-border); padding: 0.35rem 0.85rem; border-radius: var(--radius-pill); font-size: 0.82rem; font-weight: 600; }
  .bucket-chip--active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
  .search-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem; align-items: end; }
  .field-group--wide { grid-column: span 2; }
  .field-group label { display: block; font-size: 0.78rem; font-weight: 600; margin-bottom: 0.25rem; color: var(--color-text-muted); }
  .field-group input, .field-group select { width: 100%; padding: 0.6rem 0.75rem; border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: 0.9rem; }
  .search-submit { background: var(--color-accent); color: #fff; border: none; padding: 0.65rem 1.25rem; border-radius: var(--radius-sm); font-weight: 700; }
  .range-row { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.85rem; font-size: 0.82rem; color: var(--color-text-muted); flex-wrap: wrap; }
  .range-row input { width: 120px; padding: 0.35rem 0.6rem; border: 1px solid var(--color-border); border-radius: var(--radius-sm); }
  .page-section { max-width: 1140px; margin: 0 auto; padding: 2.5rem 1.5rem; }
  .page-section--tinted { background: #edf2f9; max-width: 100%; }
  .page-section--tinted > * { max-width: 1140px; margin-left: auto; margin-right: auto; }
  .section-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .section-head h2 { margin: 0; color: var(--color-primary); font-size: 1.35rem; }
  .section-head p { margin: 0.2rem 0 0; font-size: 0.88rem; color: var(--color-text-muted); }
  .tab-strip { display: flex; gap: 0.45rem; }
  .tab-btn { background: var(--color-surface); border: 1px solid var(--color-border); padding: 0.4rem 0.9rem; border-radius: var(--radius-pill); font-size: 0.84rem; font-weight: 600; }
  .tab-btn--active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
  .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)); gap: 1.25rem; }
  .listing-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-sm); }
  .listing-card:hover { background: var(--color-card-hover-tint); }
  .card-media { position: relative; height: 185px; background: #cbd5e1; }
  .card-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .card-media--masked img { filter: blur(10px) brightness(0.65); }
  .card-tag { position: absolute; top: 0.75rem; left: 0.75rem; background: rgba(17, 24, 39, 0.8); color: #fff; padding: 0.2rem 0.6rem; border-radius: var(--radius-sm); font-size: 0.72rem; font-weight: 700; }
  .card-tag--gold { background: var(--color-premium-gold); }
  .card-tag--primary { background: var(--color-primary); }
  .privacy-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; color: #fff; font-weight: 600; font-size: 0.85rem; }
  .privacy-overlay--internal { inset: auto 0 0 0; background: rgba(180, 83, 9, 0.9); padding: 0.35rem; font-size: 0.78rem; }
  .btn-req-img { background: #fff; color: var(--color-primary); border: none; padding: 0.4rem 0.8rem; border-radius: var(--radius-sm); font-weight: 700; font-size: 0.8rem; }
  .card-body { padding: 1rem 1.15rem 1.2rem; display: flex; flex-direction: column; gap: 0.45rem; }
  .card-meta { display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--color-text-muted); }
  .id-chip { font-family: monospace; font-weight: 700; color: var(--color-primary); }
  .card-body h3 { margin: 0; font-size: 1.05rem; }
  .loc-text { margin: 0; font-size: 0.85rem; color: var(--color-text-muted); }
  .price-text { margin: 0.25rem 0; font-weight: 700; color: var(--color-primary); font-size: 0.95rem; }
  .btn-card-primary { margin-top: 0.4rem; background: var(--color-primary); color: #fff; border: none; padding: 0.6rem; border-radius: var(--radius-sm); font-weight: 600; font-size: 0.88rem; }
  .btn-interested { margin-top: 0.4rem; background: var(--color-success-bg); color: var(--color-success); border: 1px solid #86efac; padding: 0.6rem; border-radius: var(--radius-sm); font-weight: 600; font-size: 0.85rem; }
  .revealed-phone { margin-top: 0.4rem; background: var(--color-success-bg); color: var(--color-success); padding: 0.55rem; border-radius: var(--radius-sm); font-weight: 700; font-size: 0.86rem; text-align: center; }
  .about-callback { max-width: 1140px; margin: 1rem auto 3rem; padding: 2rem 1.5rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); display: grid; grid-template-columns: 1.2fr 1fr; gap: 2rem; }
  .callback-card { display: flex; flex-direction: column; gap: 0.75rem; }
  .callback-card label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.82rem; font-weight: 600; }
  .callback-card input { padding: 0.55rem 0.75rem; border: 1px solid var(--color-border); border-radius: var(--radius-sm); }
  .callback-success { background: var(--color-success-bg); color: var(--color-success); padding: 0.9rem; border-radius: var(--radius-md); }
  .empty-state { grid-column: 1 / -1; background: var(--color-surface); padding: 2rem; border-radius: var(--radius-md); text-align: center; color: var(--color-text-muted); }
</style>
