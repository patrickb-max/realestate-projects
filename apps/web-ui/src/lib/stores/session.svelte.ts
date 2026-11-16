import { USER_ROLES, type AssetClass, type UserRole } from '@reprojects/constants';

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
  assignedPoc?: { name: string; email: string; mobile: string };
}

class SessionStore {
  user = $state<UserProfile | null>(null);
  selectedCity = $state<string>('Bengaluru');
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

  setUser(profile: UserProfile) {
    this.user = profile;
    this.isAuthModalOpen = false;
    this.pendingActionLabel = null;
  }

  activateAgentSubscription(cities: string[], assetClasses: AssetClass[]) {
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
  }
}

export const session = new SessionStore();
