import mongoose, { Schema } from 'mongoose';
import { USER_ROLES, ASSET_CLASSES } from '@reprojects/constants';

const V2UserSchema = new Schema({
  userCode: { type: String, required: true, unique: true },
  role: { type: String, enum: Object.values(USER_ROLES), required: true, index: true },
  accountStatus: { type: String, enum: ['incomplete', 'active', 'deactivated', 'expired', 'deleted'], default: 'incomplete' },
  mobile: { type: String, required: true, unique: true, index: true },
  name: { type: String, default: '' },
  companyName: String,
  email: String,
  operatingCity: { type: String, index: true },
  isEnterprise: { type: Boolean, default: false, index: true },
  isSubscribedAgent: { type: Boolean, default: false },
  subscribedCities: [{ city: String, tier: String, bundles: [String] }],
  contactUnlocksUsed: { type: Number, default: 0 },
  propertiesPostedCount: { type: Number, default: 0 },
  demandsPostedCount: { type: Number, default: 0 }
}, { timestamps: true, collection: 'v2_users' });

const V2PropertySchema = new Schema({
  propertyId: { type: String, required: true, unique: true, immutable: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'v2_users', required: true, index: true },
  ownerRole: { type: String, required: true },
  ownerDisplayName: { type: String, required: true },
  assetClass: { type: String, enum: Object.values(ASSET_CLASSES), required: true, index: true },
  transactionType: { type: String, enum: ['lease'], default: 'lease' },
  displayTitle: { type: String, required: true },
  city: { type: String, required: true, index: true },
  primaryLocation: { type: String, required: true },
  secondaryLocations: [{ type: String }],
  carpetAreaSqFt: { type: Number, required: true },
  builtUpAreaSqFt: { type: Number, required: true },
  quotedRentInr: { type: Number, required: true },
  ratePerSqFtInr: { type: Number, required: true },
  hideImages: { type: Boolean, default: false },
  visibilityScope: { type: String, enum: ['public', 'kd_brand_only'], default: 'public' },
  status: { type: String, enum: ['active', 'deactivated', 'closed', 'deleted'], default: 'active', index: true }
}, { timestamps: true, collection: 'v2_properties' });

const V2DemandSchema = new Schema({
  demandId: { type: String, required: true, unique: true, immutable: true },
  posterId: { type: Schema.Types.ObjectId, ref: 'v2_users', required: true, index: true },
  posterRole: { type: String, required: true },
  posterDisplayName: { type: String, required: true },
  assetClass: { type: String, enum: Object.values(ASSET_CLASSES), required: true, index: true },
  transactionType: { type: String, enum: ['lease', 'buy'], default: 'lease' },
  city: { type: String, required: true, index: true },
  primaryLocation: { type: String, required: true },
  carpetAreaSqFt: { type: Number, required: true },
  isHighTicketLead: { type: Boolean, default: false, index: true },
  isHtlUnlockedByAdmin: { type: Boolean, default: false },
  htlViewedBy: [{ kdUserId: Schema.Types.ObjectId, kdUserName: String, viewedAt: Date }],
  status: { type: String, enum: ['active', 'deactivated', 'fulfilled', 'deleted'], default: 'active', index: true },
  autoDeactivatesAt: { type: Date, required: true, index: true }
}, { timestamps: true, collection: 'v2_demands' });

const V2ContactUnlockSchema = new Schema({
  viewerId: { type: Schema.Types.ObjectId, ref: 'v2_users', required: true },
  targetType: { type: String, enum: ['property', 'demand'], required: true },
  targetListingId: { type: String, required: true },
  targetOwnerId: { type: Schema.Types.ObjectId, ref: 'v2_users', required: true },
  mode: { type: String, enum: ['two_way_reveal', 'brand_approval_required', 'kd_bypass'], required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'expired'], default: 'accepted', index: true },
  hardExpiryAt: { type: Date, index: true }
}, { timestamps: true, collection: 'v2_contact_unlocks' });

V2ContactUnlockSchema.index({ viewerId: 1, targetType: 1, targetListingId: 1 }, { unique: true });

const V2HtlThresholdSchema = new Schema({
  city: { type: String, required: true, unique: true },
  minCarpetAreaSqFt: { type: Number, required: true }
}, { timestamps: true, collection: 'v2_htl_thresholds' });

export const V2UserModel = mongoose.model('v2_users', V2UserSchema);
export const V2PropertyModel = mongoose.model('v2_properties', V2PropertySchema);
export const V2DemandModel = mongoose.model('v2_demands', V2DemandSchema);
export const V2ContactUnlockModel = mongoose.model('v2_contact_unlocks', V2ContactUnlockSchema);
export const V2HtlThresholdModel = mongoose.model('v2_htl_thresholds', V2HtlThresholdSchema);
