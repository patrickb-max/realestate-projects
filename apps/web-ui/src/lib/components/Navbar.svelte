<script lang="ts">
  import { session } from '$lib/stores/session.svelte';
  import { USER_ROLES } from '@reprojects/constants';
  import Badge from '@reprojects/design-system/Badge.svelte';

  interface Props { onOpenCitySelector: () => void; }
  let { onOpenCitySelector }: Props = $props();
  let partnerMenuOpen = $state(false);
  let profileMenuOpen = $state(false);
</script>

{#if session.user?.accountStatus === 'deactivated'}
  <div class="reactivate-banner">
    <span>Your account is currently deactivated and your listings are hidden from public view.</span>
    <button type="button" class="btn-reactivate" onclick={() => session.reactivateAccount()}>Reactivate Account</button>
  </div>
{/if}

<header class="navbar">
  <div class="navbar__left">
    <a href="/" class="brand-logo">
      <span class="brand-logo__mark">RP</span>
      <span class="brand-logo__text">RealEstate Projects</span>
    </a>
    <button type="button" class="city-trigger" onclick={onOpenCitySelector}>
      <span>📍 {session.selectedCity}</span>
      <span>▾</span>
    </button>
  </div>

  <nav class="navbar__right" aria-label="Main Navigation">
    {#if session.isGuest}
      <button type="button" class="nav-link" onclick={() => session.openLogin('Post Free Listing')}>
        Free Listing <Badge variant="success">Free</Badge>
      </button>

      <div class="dropdown">
        <button type="button" class="nav-link" onclick={() => (partnerMenuOpen = !partnerMenuOpen)}>
          List your Project &raquo;
        </button>
        {#if partnerMenuOpen}
          <div class="dropdown-menu">
            <button type="button" onclick={() => { partnerMenuOpen = false; session.openPartnerEnquiry('developer_enquiry'); }}>Developer</button>
            <button type="button" onclick={() => { partnerMenuOpen = false; session.openPartnerEnquiry('operator_enquiry'); }}>Managed Space Operator</button>
          </div>
        {/if}
      </div>
    {/if}

    {#if session.showAgentSubscriptionLink}
      <a href="/subscription" class="nav-link nav-link--highlight">Agent Subscription</a>
    {/if}

    <a href="/explore/properties" class="nav-link">Explore Properties</a>

    {#if session.canExploreDemands}
      <a href="/explore/demands" class="nav-link">Explore Demands</a>
    {/if}

    {#if session.canPostProperty}
      <a href="/post/property" class="btn-outline">Post Property</a>
    {/if}

    {#if session.canPostDemand}
      <a href="/post/demand" class="btn-outline">Post Demand</a>
    {/if}

    {#if session.isGuest}
      <button type="button" class="btn-primary" onclick={() => session.openLogin()}>Login / Sign Up</button>
    {:else if session.user}
      <div class="dropdown">
        <button type="button" class="profile-pill" onclick={() => (profileMenuOpen = !profileMenuOpen)}>
          <span class="avatar-circle">{session.user.name.charAt(0).toUpperCase()}</span>
          <span>{session.user.name}</span>
          {#if session.user.role === USER_ROLES.AGENT}
            <Badge variant={session.user.isSubscribedAgent ? 'gold' : 'neutral'}>
              {session.user.isSubscribedAgent ? 'Pro Member' : 'Trial Plan'}
            </Badge>
          {/if}
          <span>☰</span>
        </button>

        {#if profileMenuOpen}
          <div class="dropdown-menu dropdown-menu--right">
            <a href="/dashboard" onclick={() => (profileMenuOpen = false)}>Live Dashboard</a>
            {#if session.user.role === USER_ROLES.AGENT}
              <a href="/subscription" onclick={() => (profileMenuOpen = false)}>My Subscription</a>
            {/if}
            <hr />
            <button type="button" class="danger-text" onclick={() => { profileMenuOpen = false; session.logout(); }}>Logout</button>
          </div>
        {/if}
      </div>
    {/if}
  </nav>
</header>

<style>
  .reactivate-banner {
    background: #fef3c7; color: #92400e; padding: 0.65rem 1.5rem;
    display: flex; justify-content: center; align-items: center; gap: 1rem; font-size: 0.88rem;
  }
  .btn-reactivate { background: var(--color-primary); color: #fff; border: none; padding: 0.35rem 0.85rem; border-radius: var(--radius-sm); font-weight: 600; }
  .navbar {
    position: sticky; top: 0; z-index: var(--z-navbar); background: var(--color-surface);
    border-bottom: 1px solid var(--color-border); padding: 0.75rem 1.5rem;
    display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  }
  .navbar__left, .navbar__right { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
  .brand-logo { display: inline-flex; align-items: center; gap: 0.5rem; text-decoration: none; color: var(--color-primary); font-weight: 800; font-size: 1.15rem; }
  .brand-logo__mark { background: var(--color-primary); color: #fff; padding: 0.25rem 0.5rem; border-radius: var(--radius-sm); font-size: 0.9rem; }
  .city-trigger { background: var(--color-bg); border: 1px solid var(--color-border); padding: 0.4rem 0.75rem; border-radius: var(--radius-pill); font-size: 0.88rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.35rem; }
  .nav-link { background: none; border: none; text-decoration: none; color: var(--color-text-main); font-size: 0.88rem; font-weight: 500; padding: 0.35rem 0.5rem; display: inline-flex; align-items: center; gap: 0.35rem; }
  .nav-link--highlight { color: var(--color-accent); font-weight: 600; }
  .btn-outline { text-decoration: none; border: 1px solid var(--color-primary); color: var(--color-primary); padding: 0.4rem 0.85rem; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 600; }
  .btn-primary { background: var(--color-primary); color: #fff; border: none; padding: 0.48rem 1rem; border-radius: var(--radius-sm); font-size: 0.88rem; font-weight: 600; }
  .dropdown { position: relative; }
  .dropdown-menu { position: absolute; top: calc(100% + 0.4rem); left: 0; min-width: 210px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: var(--shadow-md); padding: 0.4rem; display: flex; flex-direction: column; z-index: var(--z-modal); }
  .dropdown-menu--right { left: auto; right: 0; }
  .dropdown-menu a, .dropdown-menu button { text-align: left; background: none; border: none; text-decoration: none; color: var(--color-text-main); padding: 0.55rem 0.75rem; font-size: 0.86rem; border-radius: var(--radius-sm); }
  .dropdown-menu a:hover, .dropdown-menu button:hover { background: var(--color-bg); }
  .dropdown-menu hr { border: 0; border-top: 1px solid var(--color-border); margin: 0.3rem 0; }
  .danger-text { color: var(--color-alert-dot) !important; font-weight: 600; }
  .profile-pill { display: inline-flex; align-items: center; gap: 0.5rem; background: var(--color-bg); border: 1px solid var(--color-border); padding: 0.3rem 0.7rem; border-radius: var(--radius-pill); font-size: 0.85rem; font-weight: 600; }
  .avatar-circle { width: 1.65rem; height: 1.65rem; border-radius: 50%; background: var(--color-primary); color: #fff; display: grid; place-items: center; font-size: 0.78rem; }
</style>
