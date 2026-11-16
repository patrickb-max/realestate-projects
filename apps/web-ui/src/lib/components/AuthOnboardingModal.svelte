<script lang="ts">
  import { session } from '$lib/stores/session.svelte';
  import { USER_ROLES, type AssetClass, type UserRole } from '@reprojects/constants';

  type Step = 'mobile' | 'otp' | 'role_select' | 'onboarding_form' | 'partner_form' | 'partner_done';

  let step = $state<Step>('mobile');
  let countryCode = $state('+91');
  let mobile = $state('');
  let otp = $state('');
  let otpError = $state('');
  let selectedRole = $state<UserRole>(USER_ROLES.AGENT);

  let fullName = $state('');
  let companyName = $state('');
  let email = $state('');
  let designation = $state('');
  let gstOrCin = $state('');
  let city = $state('Bengaluru');
  let location = $state('');
  let carpetArea = $state<number>(2500);
  let seatsCategory = $state<'lte_20' | 'gt_20'>('lte_20');
  let alsoInterestedInManagedSpace = $state(false);
  let selectedAssetClasses = $state<AssetClass[]>(['office']);
  let agreedTermsAnd18 = $state(false);

  $effect(() => {
    if (session.isAuthModalOpen) {
      step = session.authInitialMode === 'login' ? 'mobile' : 'partner_form';
      otpError = '';
    }
  });

  function sendOtp() {
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      otpError = 'Enter a valid 10-digit mobile number.';
      return;
    }
    otpError = '';
    step = 'otp';
  }

  function verifyOtp() {
    if (otp.length !== 6) {
      otpError = 'Invalid or expired OTP. Please enter any 6-digit code.';
      return;
    }
    otpError = '';
    step = 'role_select';
  }

  function completeOnboarding(e: SubmitEvent) {
    e.preventDefault();
    if (!agreedTermsAnd18) return;

    const isEnterpriseAutoTrigger =
      selectedRole === USER_ROLES.MANAGED_SPACE_TENANT && seatsCategory === 'gt_20';

    session.setUser({
      userId: `USR-${Date.now()}`,
      role: selectedRole,
      accountStatus: 'active',
      name: fullName,
      companyName: companyName || undefined,
      mobile: `${countryCode}${mobile}`,
      email: email || undefined,
      operatingCity: city,
      isEnterprise: isEnterpriseAutoTrigger,
      isSubscribedAgent: false,
      subscribedCities: [],
      subscribedAssetClasses: selectedAssetClasses,
      canPostManagedSpace:
        selectedRole === USER_ROLES.MANAGED_SPACE_TENANT ||
        (selectedRole === USER_ROLES.OFFICE_TENANT && alsoInterestedInManagedSpace),
      contactUnlocksUsed: 0,
      propertiesPostedCount: 0,
      demandsPostedCount: selectedRole === USER_ROLES.AGENT ? 0 : 1
    });
  }
</script>

{#if session.isAuthModalOpen}
  <div class="modal-backdrop" role="presentation" onclick={() => (session.isAuthModalOpen = false)}>
    <div class="modal-box" role="dialog" aria-modal="true" onclick={(e) => e.stopPropagation()}>
      <header class="modal-top">
        <div>
          <h3>{step.startsWith('partner') ? 'Commercial Partner Onboarding Enquiry' : 'Welcome to RealEstate Projects'}</h3>
          {#if session.pendingActionLabel}
            <p class="hint">Verify mobile to continue: <strong>{session.pendingActionLabel}</strong></p>
          {/if}
        </div>
        <button type="button" class="close-x" onclick={() => (session.isAuthModalOpen = false)}>✕</button>
      </header>

      {#if step === 'mobile'}
        <div class="form-stack">
          <label class="field-label">Mobile Number *</label>
          <div class="phone-row">
            <select bind:value={countryCode}><option value="+91">+91 (IN)</option><option value="+971">+971 (AE)</option></select>
            <input type="tel" maxlength="10" placeholder="Enter 10-digit mobile number" bind:value={mobile} />
          </div>
          {#if otpError}<p class="error-msg">{otpError}</p>{/if}
          <button type="button" class="btn-submit" onclick={sendOtp}>Continue</button>
        </div>

      {:else if step === 'otp'}
        <div class="form-stack">
          <p class="hint">Enter any 6-digit OTP sent to <strong>{countryCode} {mobile}</strong></p>
          <input type="text" maxlength="6" placeholder="123456" bind:value={otp} class="otp-input" />
          {#if otpError}<p class="error-msg">{otpError}</p>{/if}
          <button type="button" class="btn-submit" onclick={verifyOtp}>Verify OTP</button>
        </div>

      {:else if step === 'role_select'}
        <div class="form-stack">
          <p class="field-label">Who do you identify as?</p>
          <div class="role-grid">
            <button type="button" onclick={() => { selectedRole = USER_ROLES.AGENT; step = 'onboarding_form'; }}>
              <strong>Property Agent</strong><span>1 free listing &amp; 5 contact unlocks</span>
            </button>
            <button type="button" onclick={() => { selectedRole = USER_ROLES.RETAIL_BRAND; step = 'onboarding_form'; }}>
              <strong>Retail Brand</strong><span>3 free Retail demands</span>
            </button>
            <button type="button" onclick={() => { selectedRole = USER_ROLES.FNB_BRAND; step = 'onboarding_form'; }}>
              <strong>F&amp;B Brand</strong><span>3 free F&amp;B demands</span>
            </button>
            <button type="button" onclick={() => { selectedRole = USER_ROLES.OFFICE_TENANT; step = 'onboarding_form'; }}>
              <strong>Office Tenant</strong><span>Post Office space requirement</span>
            </button>
            <button type="button" onclick={() => { selectedRole = USER_ROLES.MANAGED_SPACE_TENANT; step = 'onboarding_form'; }}>
              <strong>Managed Space Tenant</strong><span>Seat-based coworking / managed office</span>
            </button>
            <button type="button" onclick={() => {
              session.setUser({
                userId: 'REP-TEAM-01', role: USER_ROLES.KD_TEAM, accountStatus: 'active',
                name: 'Himanshu (REP Team)', mobile: `${countryCode}${mobile}`,
                isEnterprise: false, isSubscribedAgent: false, subscribedCities: [],
                subscribedAssetClasses: ['office', 'retail', 'fnb', 'managed_space'],
                canPostManagedSpace: true, contactUnlocksUsed: 0, propertiesPostedCount: 14, demandsPostedCount: 9
              });
            }}>
              <strong>Internal Team (REP)</strong><span>Access HTLs &amp; All Demands</span>
            </button>
          </div>
        </div>

      {:else if step === 'onboarding_form'}
        <form class="form-stack" onsubmit={completeOnboarding}>
          <div class="two-col">
            <div><label class="field-label">Full Name *</label><input type="text" required bind:value={fullName} /></div>
            <div>
              <label class="field-label">{selectedRole === USER_ROLES.AGENT ? 'Official Email (Optional)' : 'Official Email *'}</label>
              <input type="email" required={selectedRole !== USER_ROLES.AGENT} bind:value={email} />
            </div>
          </div>
          {#if selectedRole !== USER_ROLES.AGENT}
            <div><label class="field-label">Brand / Company Name *</label><input type="text" required bind:value={companyName} /></div>
          {/if}
          <div class="two-col">
            <div>
              <label class="field-label">City *</label>
              <select bind:value={city}>
                <option value="Bengaluru">Bengaluru</option><option value="Mumbai">Mumbai</option>
                <option value="Delhi NCR">Delhi NCR</option><option value="Hyderabad">Hyderabad</option>
              </select>
            </div>
            <div><label class="field-label">Primary Locality *</label><input type="text" required bind:value={location} /></div>
          </div>
          {#if selectedRole === USER_ROLES.MANAGED_SPACE_TENANT}
            <div>
              <label class="field-label">Seats Required *</label>
              <select bind:value={seatsCategory}>
                <option value="lte_20">Up to 20 Seats (Standard)</option>
                <option value="gt_20">More than 20 Seats (Enterprise Dedicated Routing)</option>
              </select>
            </div>
          {:else if selectedRole !== USER_ROLES.AGENT}
            <div><label class="field-label">Carpet Area (sq. ft.) *</label><input type="number" min="100" required bind:value={carpetArea} /></div>
          {/if}
          {#if selectedRole === USER_ROLES.OFFICE_TENANT}
            <label class="checkbox-row"><input type="checkbox" bind:checked={alsoInterestedInManagedSpace} /><span>Also interested in Managed Office Spaces?</span></label>
          {/if}
          <label class="checkbox-row"><input type="checkbox" required bind:checked={agreedTermsAnd18} /><span>I confirm I am 18+ and accept Terms &amp; Conditions *</span></label>
          <button type="submit" class="btn-submit">Complete Setup</button>
        </form>

      {:else if step === 'partner_form'}
        <form class="form-stack" onsubmit={(e) => { e.preventDefault(); step = 'partner_done'; }}>
          <div class="two-col">
            <div><label class="field-label">Full Name *</label><input type="text" required bind:value={fullName} /></div>
            <div><label class="field-label">Company Name *</label><input type="text" required bind:value={companyName} /></div>
          </div>
          <div class="two-col">
            <div><label class="field-label">Designation *</label><input type="text" required bind:value={designation} /></div>
            <div><label class="field-label">GST / CIN No *</label><input type="text" required bind:value={gstOrCin} /></div>
          </div>
          <label class="checkbox-row"><input type="checkbox" required bind:checked={agreedTermsAnd18} /><span>I confirm I am 18+ and accept Terms &amp; Conditions *</span></label>
          <button type="submit" class="btn-submit">Submit Enquiry</button>
        </form>

      {:else}
        <div class="form-stack">
          <p>Thank you. Our onboarding team will verify your details and reach out within 24 hours.</p>
          <button type="button" class="btn-submit" onclick={() => (session.isAuthModalOpen = false)}>Got it, I'll wait</button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal-backdrop { position: fixed; inset: 0; background: rgba(17, 24, 39, 0.6); z-index: var(--z-modal); display: grid; place-items: center; padding: 1rem; }
  .modal-box { background: var(--color-surface); width: min(540px, 100%); border-radius: var(--radius-lg); padding: 1.5rem; box-shadow: var(--shadow-md); }
  .modal-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
  .modal-top h3 { margin: 0; color: var(--color-primary); }
  .hint { margin: 0.25rem 0 0; font-size: 0.85rem; color: var(--color-text-muted); }
  .close-x { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 0.3rem 0.6rem; }
  .form-stack { display: flex; flex-direction: column; gap: 0.9rem; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  .field-label { display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.3rem; }
  input, select { width: 100%; padding: 0.6rem 0.75rem; border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: 0.9rem; }
  .phone-row { display: grid; grid-template-columns: 110px 1fr; gap: 0.5rem; }
  .otp-input { letter-spacing: 0.45rem; font-size: 1.25rem; text-align: center; font-weight: 700; }
  .role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem; }
  .role-grid button { text-align: left; padding: 0.75rem; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 0.2rem; }
  .role-grid button span { font-size: 0.76rem; color: var(--color-text-muted); }
  .checkbox-row { display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.82rem; }
  .checkbox-row input { width: auto; margin-top: 0.2rem; }
  .btn-submit { background: var(--color-primary); color: #fff; border: none; padding: 0.7rem 1rem; border-radius: var(--radius-sm); font-weight: 600; font-size: 0.92rem; }
  .error-msg { margin: 0; color: var(--color-alert-dot); font-size: 0.82rem; font-weight: 600; }
</style>
