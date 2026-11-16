export const USER_ROLES = {
  GUEST: 'guest',
  AGENT: 'agent',
  RETAIL_BRAND: 'retail_brand',
  FNB_BRAND: 'fnb_brand',
  OFFICE_TENANT: 'office_tenant',
  MANAGED_SPACE_TENANT: 'managed_space_tenant',
  KD_TEAM: 'kd_team',
  SUPER_ADMIN: 'super_admin'
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ASSET_CLASSES = {
  OFFICE: 'office',
  RETAIL: 'retail',
  FNB: 'fnb',
  MANAGED_SPACE: 'managed_space'
} as const;

export type AssetClass = (typeof ASSET_CLASSES)[keyof typeof ASSET_CLASSES];

export const TIER_1_HTL_CITIES = [
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Coimbatore',
  'Pune',
  'Mumbai',
  'Gurugram',
  'Delhi'
] as const;

export const DEFAULT_HTL_THRESHOLDS_SQFT: Record<string, number> = {
  Mumbai: 5000,
  Bengaluru: 10000,
  Hyderabad: 10000,
  Chennai: 10000,
  Coimbatore: 10000,
  Pune: 10000,
  Gurugram: 10000,
  Delhi: 10000
};

export const FREE_QUOTAS = {
  AGENT_FREE_PROPERTIES: 1,
  AGENT_FREE_DEMANDS: 1,
  AGENT_TRIAL_CONTACT_CLICKS: 5,
  BRAND_FREE_DEMANDS: 3,
  BRAND_TRIAL_CONTACT_VIEWS: 5,
  TENANT_FREE_DEMANDS: 1,
  TENANT_TRIAL_CONTACT_VIEWS: 5,
  MANAGED_SPACE_FREE_DEMANDS: 1,
  MANAGED_SPACE_ENTERPRISE_SEAT_THRESHOLD: 20
} as const;

export const SUBSCRIPTION_PRICING_INR = {
  METRO_SINGLE_BUNDLE: 1000,
  NON_METRO_SINGLE_BUNDLE: 750,
  REST_OF_INDIA_SINGLE_BUNDLE: 1000,
  PAN_INDIA_SINGLE_BUNDLE: 5000,
  GST_RATE: 0.18
} as const;
