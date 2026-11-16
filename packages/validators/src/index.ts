import { z } from 'zod';
import { ASSET_CLASSES, GENERIC_EMAIL_DOMAINS } from '@reprojects/constants';

export const officialEmailSchema = z.string().email().refine((email) => {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain && !GENERIC_EMAIL_DOMAINS.includes(domain as any);
}, 'Please enter an official company email ID (generic domains like gmail.com are not permitted)');

export const createPropertySchema = z.object({
  assetClass: z.enum([ASSET_CLASSES.OFFICE, ASSET_CLASSES.RETAIL, ASSET_CLASSES.FNB, ASSET_CLASSES.MANAGED_SPACE]),
  transactionType: z.literal('lease').default('lease'),
  projectName: z.string().trim().optional(),
  storeType: z.string().optional(),
  city: z.string().min(2),
  primaryLocation: z.string().min(2),
  secondaryLocations: z.array(z.string()).max(3).default([]),
  carpetAreaSqFt: z.number().positive(),
  builtUpAreaSqFt: z.number().positive(),
  quotedRentInr: z.number().positive(),
  floor: z.string().min(1),
  possession: z.string(),
  ocStatus: z.string(),
  hideImages: z.boolean().default(false),
  visibilityScope: z.enum(['public', 'kd_brand_only']).default('public'),
  media: z.any()
}).refine((data) => data.carpetAreaSqFt <= data.builtUpAreaSqFt, {
  message: 'Carpet Area must be less than or equal to Built-up Area',
  path: ['carpetAreaSqFt']
});

export const createDemandSchema = z.object({
  assetClass: z.enum([ASSET_CLASSES.OFFICE, ASSET_CLASSES.RETAIL, ASSET_CLASSES.FNB, ASSET_CLASSES.MANAGED_SPACE]),
  transactionType: z.enum(['lease', 'buy']).default('lease'),
  city: z.string().min(2),
  primaryLocation: z.string().min(2),
  secondaryLocations: z.array(z.string()).max(4).default([]),
  carpetAreaSqFt: z.number().positive(),
  budgetMaxInr: z.number().nonnegative().default(0),
  numberOfSeats: z.number().positive().optional(),
  possessionNeeded: z.string(),
  ocRequired: z.boolean().default(false)
});
