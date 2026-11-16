import { USER_ROLES, type AssetClass, type UserRole } from '@reprojects/constants';
import { coreApi } from '$lib/api/client';

export interface UserProfile {
  userId: string;
  role: UserRole;
  accountStatus: 'active' | 'deactivated' | 'expired';
  name: string;
  companyName?: string;
  mobile: string;
  email?: string;
  operatingCity?: string;
  isEnterprise: boolean;
  isSubscribedAgent: boolean;
  subscribedCities: string[];
  subscribedAssetClasses: AssetClass[];
  canPostManagedSpace: boolean;
  contactUnlocksUsed: number;
  propertiesPostedCount: number;
  demandsPostedCount: number;
}

class SessionStore {
  user = $state<UserProfile | null>(null);
  token = $state<string | null>(null);
  selectedCity = $state<string>('Bengaluru'); // Default launch market
  isAuthModalOpen = $state<boolean>(false);
  authInitialMode = $state<'login' | 'developer_enquiry' | 'operator_enquiry'>('login');
  pendingActionLabel = $state<string | null>(null);

  isGuest = $derived(this.user === null);
  isInternalTeam = $derived(
    this.user?.role === USER_ROLES.KD_TEAM || this.user?.role === USER_ROLES.SUPER_ADMIN
  );
  canExploreDemands = $derived(this.isInternalTeam);
  canPostProperty = $derived(this.user?.role === USER_ROLES.AGENT || this.isInternalTeam);
  canPostDemand = $derived(
    this.user !== null &&
      [
        USER_ROLES.AGENT,
        USER_ROLES.RETAIL_BRAND,
        USER_ROLES.FNB_BRAND,
        USER_ROLES.OFFICE_TENANT,
        USER_ROLES.MANAGED_SPACE_TENANT,
        USER_ROLES.KD_TEAM,
        USER_ROLES.SUPER_ADMIN
      ].includes(this.user.role as any)
  );
  showAgentSubscriptionLink = $derived(
    this.isGuest || (this.user?.role === USER_ROLES.AGENT && !this.user.isSubscribedAgent)
  );
  showEnterpriseUpgradeBtn = $derived(
    this.user !== null &&
      !this.user.isEnterprise &&
      [
        USER_ROLES.RETAIL_BRAND,
        USER_ROLES.FNB_BRAND,
        USER_ROLES.OFFICE_TENANT,
        USER_ROLES.MANAGED_SPACE_TENANT
      ].includes(this.user.role as any)
  );

  openLogin(actionLabel: string | null = null) {
    this.authInitialMode = 'login';
    this.pendingActionLabel = actionLabel;
    this.isAuthModalOpen = true;
  }

  openPartnerEnquiry(type: 'developer_enquiry' | 'operator_enquiry') {
    this.authInitialMode = type;
    this.pendingActionLabel = null;
    this.isAuthModalOpen = true;
  }

  setUser(profile: UserProfile, jwtToken: string | null = null) {
    this.user = profile;
    if (jwtToken) this.token = jwtToken;
    this.isAuthModalOpen = false;
    this.pendingActionLabel = null;
  }

  async authenticateWithBackend(payload: {
    mobile: string;
    otp: string;
    role: UserRole;
    name: string;
    companyName?: string;
    operatingCity?: string;
    canPostManagedSpace?: boolean;
    isEnterprise?: boolean;
    selectedAssetClasses?: AssetClass[];
  }) {
    const res = await coreApi<{ token: string; user: any }>('/api/v2/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    this.setUser(
      {
        userId: res.user._id,
        role: res.user.role,
        accountStatus: res.user.accountStatus || 'active',
        name: res.user.name || payload.name,
        companyName: res.user.companyName || payload.companyName,
        mobile: res.user.mobile,
        operatingCity: res.user.operatingCity || payload.operatingCity,
        isEnterprise: Boolean(res.user.isEnterprise || payload.isEnterprise),
        isSubscribedAgent: Boolean(res.user.isSubscribedAgent),
        subscribedCities: (res.user.subscribedCities || []).map((c: any) => c.city),
        subscribedAssetClasses: payload.selectedAssetClasses || ['office'],
        canPostManagedSpace: Boolean(payload.canPostManagedSpace),
        contactUnlocksUsed: res.user.contactUnlocksUsed || 0,
        propertiesPostedCount: res.user.propertiesPostedCount || 0,
        demandsPostedCount: res.user.demandsPostedCount || 0
      },
      res.token
    );
  }

  async activateAgentSubscription(cities: string[], assetClasses: AssetClass[], subtotalInr: number) {
    if (this.token) {
      await coreApi(
        '/api/v2/subscriptions/activate',
        { method: 'POST', body: JSON.stringify({ cities, subtotalInr }) },
        this.token
      );
    }
    if (!this.user) return;
    this.user = {
      ...this.user,
      isSubscribedAgent: true,
      subscribedCities: cities,
      subscribedAssetClasses: assetClasses
    };
  }

  reactivateAccount() {
    if (!this.user) return;
    this.user = { ...this.user, accountStatus: 'active', isSubscribedAgent: false };
  }

  logout() {
    this.user = null;
    this.token = null;
  }
}

export const session = new SessionStore();
