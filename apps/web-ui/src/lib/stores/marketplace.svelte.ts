import { USER_ROLES, type AssetClass } from '@reprojects/constants';
import { session } from './session.svelte';

export interface PropertyListing {
  propertyId: string;
  ownerId: string;
  ownerRole: string;
  ownerDisplayName: string;
  internalPosterName?: string;
  ownerMobile: string;
  assetClass: AssetClass;
  transactionType: 'lease';
  projectName?: string;
  storeType?: string;
  displayTitle: string;
  city: string;
  primaryLocation: string;
  secondaryLocations: string[];
  carpetAreaSqFt: number;
  builtUpAreaSqFt: number;
  quotedRentInr: number;
  ratePerSqFtInr: number;
  floor: string;
  possession: string;
  ocStatus: string;
  hideImages: boolean;
  visibilityScope: 'public' | 'kd_brand_only';
  thumbnailUrl: string;
  relevancyCount: number;
  hasUnreadMatches: boolean;
  createdAt: string;
}

export interface DemandListing {
  demandId: string;
  posterId: string;
  posterRole: string;
  posterDisplayName: string;
  internalPosterName?: string;
  posterMobile: string;
  assetClass: AssetClass;
  transactionType: 'lease' | 'buy';
  city: string;
  primaryLocation: string;
  secondaryLocations: string[];
  carpetAreaSqFt: number;
  numberOfSeats?: number;
  possessionNeeded: string;
  ocRequired: boolean;
  isHighTicketLead: boolean;
  isHtlUnlockedByAdmin: boolean;
  viewedByTeam: { name: string; viewedAt: string }[];
  relevancyCount: number;
  hasUnreadMatches: boolean;
  createdAt: string;
}

export interface ProjectListing {
  projectId: string;
  projectName: string;
  developerOrOperator: string;
  category: 'standard' | 'premium' | 'exclusive';
  assetClass: AssetClass;
  city: string;
  location: string;
  totalSizeSqFt?: number;
  seatsAvailable?: number;
  pricePerSeatInr?: number;
  possessionDate: string;
  projectType: string;
  thumbnailUrl: string;
}

export interface InboundLeadItem {
  id: string;
  type: 'phone_view' | 'brand_contact_request' | 'image_request';
  listingId: string;
  requesterName: string;
  requesterRole: string;
  requesterMobile: string;
  status: 'pending' | 'accepted' | 'rejected';
  isRead: boolean;
  timestamp: string;
}

export interface RecentSearch {
  city: string;
  location: string;
  assetClass: AssetClass;
  transactionType: 'lease' | 'sale';
  timestamp: string;
}

class MarketplaceStore {
  properties = $state<PropertyListing[]>([
    {
      propertyId: 'PR-401902',
      ownerId: 'USR-AGENT-1',
      ownerRole: USER_ROLES.AGENT,
      ownerDisplayName: 'Vikramaditya Rao',
      ownerMobile: '+91 98450 11223',
      assetClass: 'office',
      transactionType: 'lease',
      projectName: 'Prestige Tech Platina',
      displayTitle: 'Prestige Tech Platina',
      city: 'Bengaluru',
      primaryLocation: 'Outer Ring Road (ORR)',
      secondaryLocations: ['Bellandur', 'Marathahalli'],
      carpetAreaSqFt: 12500,
      builtUpAreaSqFt: 16000,
      quotedRentInr: 1187500,
      ratePerSqFtInr: 95,
      floor: '6th Floor',
      possession: 'Immediate',
      ocStatus: 'Ready',
      hideImages: false,
      visibilityScope: 'public',
      thumbnailUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
      relevancyCount: 4,
      hasUnreadMatches: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      propertyId: 'PR-401944',
      ownerId: 'USR-AGENT-2',
      ownerRole: USER_ROLES.AGENT,
      ownerDisplayName: 'Ananya Deshmukh',
      ownerMobile: '+91 98201 44556',
      assetClass: 'retail',
      transactionType: 'lease',
      storeType: 'Highstreet',
      displayTitle: 'Highstreet Retail Property for Lease',
      city: 'Bengaluru',
      primaryLocation: 'Indiranagar 100 Feet Road',
      secondaryLocations: ['Koramangala 4th Block'],
      carpetAreaSqFt: 3200,
      builtUpAreaSqFt: 3800,
      quotedRentInr: 640000,
      ratePerSqFtInr: 200,
      floor: 'Ground',
      possession: 'Immediate',
      ocStatus: 'Ready',
      hideImages: true,
      visibilityScope: 'public',
      thumbnailUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=800&q=80',
      relevancyCount: 2,
      hasUnreadMatches: false,
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      propertyId: 'PR-402110',
      ownerId: 'REP-TEAM-01',
      ownerRole: USER_ROLES.KD_TEAM,
      ownerDisplayName: 'RealEstate Projects',
      internalPosterName: 'Himanshu',
      ownerMobile: '+91 99000 77889',
      assetClass: 'managed_space',
      transactionType: 'lease',
      projectName: 'BKC Executive Managed Hub',
      displayTitle: 'BKC Executive Managed Hub',
      city: 'Mumbai',
      primaryLocation: 'Bandra Kurla Complex (BKC)',
      secondaryLocations: ['Lower Parel'],
      carpetAreaSqFt: 8500,
      builtUpAreaSqFt: 10200,
      quotedRentInr: 1450000,
      ratePerSqFtInr: 170.59,
      floor: '11th Floor',
      possession: 'Immediate',
      ocStatus: 'Ready',
      hideImages: false,
      visibilityScope: 'public',
      thumbnailUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80',
      relevancyCount: 5,
      hasUnreadMatches: true,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]);

  demands = $state<DemandListing[]>([
    {
      demandId: 'DM-880101',
      posterId: 'USR-CORP-1',
      posterRole: USER_ROLES.OFFICE_TENANT,
      posterDisplayName: 'FinStack Technologies Pvt Ltd',
      posterMobile: '+91 98111 22334',
      assetClass: 'office',
      transactionType: 'lease',
      city: 'Mumbai',
      primaryLocation: 'BKC',
      secondaryLocations: ['Lower Parel', 'Worli'],
      carpetAreaSqFt: 8500, // Exceeds Mumbai 5,000 sq ft HTL threshold
      possessionNeeded: 'Immediate',
      ocRequired: true,
      isHighTicketLead: true,
      isHtlUnlockedByAdmin: false,
      viewedByTeam: [],
      relevancyCount: 3,
      hasUnreadMatches: true,
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
    },
    {
      demandId: 'DM-880145',
      posterId: 'USR-BRAND-1',
      posterRole: USER_ROLES.FNB_BRAND,
      posterDisplayName: 'Artisan Roast Coffee Co.',
      posterMobile: '+91 98765 00112',
      assetClass: 'fnb',
      transactionType: 'lease',
      city: 'Bengaluru',
      primaryLocation: 'Indiranagar',
      secondaryLocations: ['Koramangala', 'Lavelle Road'],
      carpetAreaSqFt: 2400,
      possessionNeeded: 'In 3 months',
      ocRequired: true,
      isHighTicketLead: false,
      isHtlUnlockedByAdmin: false,
      viewedByTeam: [],
      relevancyCount: 6,
      hasUnreadMatches: true,
      createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString()
    }
  ]);

  projects = $state<ProjectListing[]>([
    {
      projectId: 'PJ-9001',
      projectName: 'Embassy One Commercial Tower',
      developerOrOperator: 'Embassy Group',
      category: 'premium',
      assetClass: 'office',
      city: 'Bengaluru',
      location: 'Hebbal / Bellary Road',
      totalSizeSqFt: 250000,
      possessionDate: 'Q4 2026',
      projectType: 'IT Park',
      thumbnailUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'
    },
    {
      projectId: 'PJ-9002',
      projectName: 'Phoenix Palladium Retail Wing',
      developerOrOperator: 'Phoenix Mills',
      category: 'premium',
      assetClass: 'retail',
      city: 'Mumbai',
      location: 'Lower Parel',
      totalSizeSqFt: 180000,
      possessionDate: 'Immediate',
      projectType: 'Mall',
      thumbnailUrl: 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&w=800&q=80'
    },
    {
      projectId: 'PJ-9055',
      projectName: 'Nexus Skydeck F&B Promenade (Mandated)',
      developerOrOperator: 'RealEstate Projects Exclusive Mandate',
      category: 'exclusive',
      assetClass: 'fnb',
      city: 'Hyderabad',
      location: 'HITEC City',
      totalSizeSqFt: 65000,
      possessionDate: 'Immediate',
      projectType: 'Mixed Use',
      thumbnailUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'
    },
    {
      projectId: 'PJ-9088',
      projectName: 'WorkSphere Flagship Managed Campus',
      developerOrOperator: 'WorkSphere Managed Operators',
      category: 'exclusive',
      assetClass: 'managed_space',
      city: 'Bengaluru',
      location: 'MG Road CBD',
      seatsAvailable: 450,
      pricePerSeatInr: 18500,
      possessionDate: 'Immediate',
      projectType: 'Managed Office Center',
      thumbnailUrl: 'https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=800&q=80'
    }
  ]);

  inboundLeads = $state<InboundLeadItem[]>([
    {
      id: 'LD-101',
      type: 'brand_contact_request',
      listingId: 'DM-880145',
      requesterName: 'Rohan Kulkarni',
      requesterRole: 'Property Agent',
      requesterMobile: '+91 98220 33445',
      status: 'pending',
      isRead: false,
      timestamp: '2 hours ago'
    },
    {
      id: 'LD-102',
      type: 'image_request',
      listingId: 'PR-401944',
      requesterName: 'Meera Nair (Retail Expansion)',
      requesterRole: 'Retail Brand',
      requesterMobile: '+91 99451 66778',
      status: 'pending',
      isRead: false,
      timestamp: '5 hours ago'
    },
    {
      id: 'LD-103',
      type: 'phone_view',
      listingId: 'PR-401902',
      requesterName: 'CloudScale Systems',
      requesterRole: 'Office Tenant',
      requesterMobile: '+91 98800 55443',
      status: 'accepted',
      isRead: false,
      timestamp: '1 day ago'
    }
  ]);

  recentSearches = $state<RecentSearch[]>([
    { city: 'Bengaluru', location: 'Outer Ring Road', assetClass: 'office', transactionType: 'lease', timestamp: 'Today' }
  ]);

  unlockedContacts = $state<Record<string, string>>({});
  imageRequests = $state<Record<string, 'pending' | 'accepted' | 'rejected'>>({});
  projectInterests = $state<Record<string, string>>({});
  gateAlert = $state<string | null>(null);

  recordSearch(search: Omit<RecentSearch, 'timestamp'>) {
    this.recentSearches = [
      { ...search, timestamp: 'Just now' },
      ...this.recentSearches.filter(
        (s) => !(s.city === search.city && s.location === search.location && s.assetClass === search.assetClass)
      )
    ].slice(0, 4);
  }

  unlockPropertyPhone(property: PropertyListing) {
    if (!session.user) {
      session.openLogin(`View Contact for ${property.propertyId}`);
      return;
    }
    if (this.unlockedContacts[property.propertyId]) return;

    if (!session.isInternalTeam) {
      const hasUnlimited =
        (session.user.role === USER_ROLES.AGENT && session.user.isSubscribedAgent) ||
        session.user.isEnterprise;

      if (!hasUnlimited && session.user.contactUnlocksUsed >= 5) {
        this.gateAlert =
          session.user.role === USER_ROLES.AGENT
            ? 'Kindly subscribe to continue (5 free lifetime contact clicks reached).'
            : 'You have used all 5 free contact views. Upgrade to Enterprise Solution for unlimited access.';
        return;
      }

      session.user = { ...session.user, contactUnlocksUsed: session.user.contactUnlocksUsed + 1 };
    }

    this.gateAlert = null;
    this.unlockedContacts = { ...this.unlockedContacts, [property.propertyId]: property.ownerMobile };
  }

  requestPropertyImages(property: PropertyListing) {
    if (!session.user) {
      session.openLogin(`Request Images for ${property.propertyId}`);
      return;
    }
    if (session.isInternalTeam || this.imageRequests[property.propertyId]) return;
    this.imageRequests = { ...this.imageRequests, [property.propertyId]: 'pending' };
  }

  showProjectInterest(project: ProjectListing) {
    if (!session.user) {
      session.openLogin(`Show Interest in ${project.projectName}`);
      return;
    }
    if (this.projectInterests[project.projectId]) return;
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    this.projectInterests = { ...this.projectInterests, [project.projectId]: today };
  }

  actionLead(leadId: string, decision: 'accepted' | 'rejected') {
    this.inboundLeads = this.inboundLeads.map((l) =>
      l.id === leadId ? { ...l, status: decision, isRead: true } : l
    );
  }

  recordHtlView(demandId: string) {
    if (!session.user || !session.isInternalTeam) return;
    const nowStr = new Date().toLocaleString('en-IN');
    this.demands = this.demands.map((d) =>
      d.demandId === demandId
        ? { ...d, viewedByTeam: [...d.viewedByTeam, { name: session.user!.name, viewedAt: nowStr }] }
        : d
    );
  }
}

export const marketplace = new MarketplaceStore();
