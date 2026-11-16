import {
  ASSET_CLASSES,
  TIER_1_HTL_CITIES,
  USER_ROLES,
  DEFAULT_HTL_THRESHOLDS_SQFT,
  SLA_CONSTANTS
} from '@reprojects/constants';

export function evaluateHighTicketLead(input: {
  city: string;
  assetClass: string;
  carpetAreaSqFt: number;
  posterRole: string;
  isEnterprisePoster: boolean;
  cityThresholdsMap: Record<string, number>;
}) {
  const normalizedCity = input.city.trim();
  const isTier1 = TIER_1_HTL_CITIES.some((c) => c.toLowerCase() === normalizedCity.toLowerCase());

  if (input.assetClass === ASSET_CLASSES.MANAGED_SPACE) {
    return { isHighTicketLead: true, isExternallyBlackedOut: true, reason: 'HTL_EXCLUSIVE_TO_KD' };
  }
  if (!isTier1) {
    return { isHighTicketLead: false, isExternallyBlackedOut: false, reason: 'TIER_2_CITY_BYPASS' };
  }
  if (input.isEnterprisePoster) {
    return { isHighTicketLead: false, isExternallyBlackedOut: false, reason: 'ENTERPRISE_BRAND_EXEMPTION' };
  }
  if (input.posterRole === USER_ROLES.AGENT) {
    return { isHighTicketLead: false, isExternallyBlackedOut: false, reason: 'AGENT_POSTED_EXEMPTION' };
  }

  const threshold =
    input.cityThresholdsMap[normalizedCity] ?? DEFAULT_HTL_THRESHOLDS_SQFT[normalizedCity] ?? 10000;

  if (input.carpetAreaSqFt > threshold) {
    return { isHighTicketLead: true, isExternallyBlackedOut: true, reason: 'HTL_EXCLUSIVE_TO_KD', threshold };
  }
  return { isHighTicketLead: false, isExternallyBlackedOut: false, reason: 'BELOW_THRESHOLD', threshold };
}

export function calculateBrandRequestDeadlines(createdAt: Date = new Date()) {
  const workingDaysDeadline = new Date(createdAt.getTime());
  let added = 0;
  while (added < SLA_CONSTANTS.BRAND_CONTACT_WORKING_DAYS) {
    workingDaysDeadline.setUTCDate(workingDaysDeadline.getUTCDate() + 1);
    const dayOfWeek = workingDaysDeadline.getUTCDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) added += 1;
  }
  const hardExpiryAt = new Date(
    createdAt.getTime() + SLA_CONSTANTS.BRAND_CONTACT_EXPIRY_HOURS * 60 * 60 * 1000
  );
  return { workingDaysDeadline, hardExpiryAt };
}

export function scorePropertyAgainstDemand(
  demand: {
    assetClass: string;
    city: string;
    primaryLocation: string;
    secondaryLocations?: string[];
    carpetAreaSqFt: number;
    transactionType: string;
    isHighTicketLead?: boolean;
    isHtlUnlockedByAdmin?: boolean;
  },
  property: {
    assetClass: string;
    city: string;
    primaryLocation: string;
    secondaryLocations?: string[];
    carpetAreaSqFt: number;
    transactionType: string;
    visibilityScope?: string;
  },
  viewerRole: string
): { score: number; reasons: string[] } | null {
  if (demand.assetClass !== property.assetClass) return null;
  if (demand.city.toLowerCase() !== property.city.toLowerCase()) return null;
  if (demand.transactionType !== property.transactionType) return null;

  // Managed space demands are exclusively visible to internal team
  if (
    demand.assetClass === ASSET_CLASSES.MANAGED_SPACE &&
    viewerRole !== USER_ROLES.KD_TEAM &&
    viewerRole !== USER_ROLES.SUPER_ADMIN
  ) {
    return null;
  }

  // Un-unlocked HTLs are hidden from external agents
  if (demand.isHighTicketLead && !demand.isHtlUnlockedByAdmin && viewerRole === USER_ROLES.AGENT) {
    return null;
  }

  // KD/Brand-only supply is hidden from external agents
  if (property.visibilityScope === 'kd_brand_only' && viewerRole === USER_ROLES.AGENT) {
    return null;
  }

  let score = 40;
  const reasons = ['City, asset class & transaction match'];

  const demandLocs = [demand.primaryLocation, ...(demand.secondaryLocations ?? [])].map((l) =>
    l.trim().toLowerCase()
  );
  const propLoc = property.primaryLocation.trim().toLowerCase();

  if (demand.primaryLocation.trim().toLowerCase() === propLoc) {
    score += 30;
    reasons.push('Exact primary locality match');
  } else if (demandLocs.includes(propLoc)) {
    score += 20;
    reasons.push('Matches secondary preferred locality');
  }

  const ratio = property.carpetAreaSqFt / Math.max(1, demand.carpetAreaSqFt);
  if (ratio >= 0.9 && ratio <= 1.15) {
    score += 30;
    reasons.push('Ideal carpet area fit');
  } else if (ratio >= 0.75 && ratio <= 1.3) {
    score += 15;
    reasons.push('Acceptable carpet area variance');
  } else {
    return null;
  }

  return { score: Math.min(100, score), reasons };
}
