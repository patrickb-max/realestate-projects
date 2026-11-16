import type { AssetClass, CityTier, UserRole, SubscriptionBundle } from '@reprojects/constants';

export interface AuthUserContext {
  userId: string;
  role: UserRole;
  accountStatus: string;
  isEnterprise: boolean;
  enterpriseAccountId?: string;
  isSubscribedAgent: boolean;
  subscribedBundles: SubscriptionBundle[];
  subscribedCities: string[];
  isPanIndia: boolean;
  operatingCity?: string;
  assignedCities?: string[];
  canPostManagedSpace?: boolean;
  name: string;
  companyName?: string;
  mobile: string;
  email?: string;
  contactUnlocksUsed: number;
}
