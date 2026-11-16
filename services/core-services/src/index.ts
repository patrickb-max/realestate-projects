import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { optionalAuth, requireAuth } from './middleware/auth-rbac.middleware.js';
import {
  V2PropertyModel,
  V2DemandModel,
  V2ContactUnlockModel,
  V2UserModel,
  V2HtlThresholdModel
} from '@reprojects/database';
import { createPropertySchema, createDemandSchema } from '@reprojects/validators';
import {
  evaluateHighTicketLead,
  calculateBrandRequestDeadlines,
  scorePropertyAgainstDemand
} from '@reprojects/domain';
import { USER_ROLES, FREE_QUOTAS, SLA_CONSTANTS, SUBSCRIPTION_PRICING_INR } from '@reprojects/constants';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || 'DEV_SECRET';

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Root & Health Endpoints
app.get('/', (_req, res) => {
  res.json({
    service: '@reprojects/core-services',
    version: '2.0.0',
    status: 'running',
    endpoints: [
      'GET /health',
      'POST /api/v2/auth/verify-otp',
      'GET /api/v2/properties',
      'POST /api/v2/properties',
      'GET /api/v2/demands/explore',
      'POST /api/v2/demands',
      'GET /api/v2/relevancies/demand/:demandId',
      'POST /api/v2/unlock',
      'POST /api/v2/subscriptions/activate'
    ]
  });
});

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    dbConnected: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString()
  });
});

// 1. Mobile OTP Verification & Partial Lead Capture (EP-001)
app.post('/api/v2/auth/verify-otp', async (req, res) => {
  const { mobile, otp, role, name, companyName, operatingCity } = req.body;
  if (!mobile || String(otp).length !== 6) {
    return res.status(400).json({ error: 'INVALID_OTP', message: 'Valid mobile and 6-digit OTP required.' });
  }

  let user = await V2UserModel.findOne({ mobile });
  if (!user) {
    user = await V2UserModel.create({
      userCode: `USR-${Math.floor(100000 + Math.random() * 900000)}`,
      mobile,
      role: role || USER_ROLES.AGENT,
      name: name || '',
      companyName,
      operatingCity: operatingCity || 'Bengaluru',
      accountStatus: name ? 'active' : 'incomplete'
    });
  } else if (name && user.accountStatus === 'incomplete') {
    user.name = name;
    if (role) user.role = role;
    if (companyName) user.companyName = companyName;
    if (operatingCity) user.operatingCity = operatingCity;
    user.accountStatus = 'active';
    await user.save();
  }

  const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({ token, user });
});

// 2. Explore Properties (Office-first priority & Hidden-Image privacy masking)
app.get('/api/v2/properties', optionalAuth, async (req, res) => {
  const { city = 'Bengaluru', assetClass, minArea, maxArea } = req.query;
  const user = req.user;

  const filter: Record<string, unknown> = {
    status: 'active',
    city: new RegExp(`^${String(city).trim()}$`, 'i')
  };

  if (assetClass) filter.assetClass = String(assetClass);
  if (minArea || maxArea) {
    filter.carpetAreaSqFt = {
      ...(minArea ? { $gte: Number(minArea) } : {}),
      ...(maxArea ? { $lte: Number(maxArea) } : {})
    };
  }
  if (!user || user.role === USER_ROLES.AGENT) {
    filter.visibilityScope = 'public';
  }

  const properties = await V2PropertyModel.find(filter).sort({ createdAt: -1 }).limit(50).lean();
  const isKdViewer = user?.role === USER_ROLES.KD_TEAM || user?.role === USER_ROLES.SUPER_ADMIN;

  const formatted = properties.map((p: any) => {
    const isOwner = user && p.ownerId.toString() === user.userId;
    const canViewImages = !p.hideImages || isKdViewer || isOwner;
    return {
      ...p,
      hiddenImageBanner: isKdViewer && p.hideImages ? 'Hidden to others' : null,
      imagesMasked: !canViewImages,
      canRequestImages: !isKdViewer && !isOwner && Boolean(p.hideImages)
    };
  });

  return res.json({ count: formatted.length, properties: formatted });
});

// 3. Post Property (With Agent Quotas & Managed Space Lock)
app.post('/api/v2/properties', optionalAuth, requireAuth, async (req, res) => {
  const parsed = createPropertySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const user = req.user!;
  const input = parsed.data;

  if (user.role === USER_ROLES.AGENT) {
    if (input.assetClass === 'managed_space') {
      return res.status(403).json({ error: 'Agents cannot post Managed Space properties.' });
    }
    const dbUser = await V2UserModel.findById(user.userId);
    if (!dbUser!.isSubscribedAgent && dbUser!.propertiesPostedCount >= FREE_QUOTAS.AGENT_FREE_PROPERTIES) {
      return res.status(402).json({ error: 'Free listing quota exhausted. Kindly subscribe to continue.' });
    }
  }

  const ratePerSqFtInr = Math.round((input.quotedRentInr / input.carpetAreaSqFt) * 100) / 100;
  const property = await V2PropertyModel.create({
    propertyId: `PR-${Math.floor(100000 + Math.random() * 900000)}`,
    ownerId: user.userId,
    ownerRole: user.role,
    ownerDisplayName: user.role === USER_ROLES.KD_TEAM ? 'RealEstate Projects' : user.name,
    ...input,
    ratePerSqFtInr,
    displayTitle: input.projectName || `${input.assetClass.toUpperCase()} Property for Lease`
  });

  await V2UserModel.findByIdAndUpdate(user.userId, { $inc: { propertiesPostedCount: 1 } });
  return res.status(201).json(property);
});

// 4. Explore Demands (Strictly Internal Team Only per EP-009)
app.get('/api/v2/demands/explore', optionalAuth, requireAuth, async (req, res) => {
  const user = req.user!;
  if (user.role !== USER_ROLES.KD_TEAM && user.role !== USER_ROLES.SUPER_ADMIN) {
    return res.status(403).json({ error: 'Demand exploration is restricted exclusively to the internal team.' });
  }
  const demands = await V2DemandModel.find({ status: 'active' }).sort({ createdAt: -1 }).limit(100).lean();
  return res.json({ count: demands.length, demands });
});

// 5. Post Demand (With HTL Classification & 60-Day Expiry)
app.post('/api/v2/demands', optionalAuth, requireAuth, async (req, res) => {
  const parsed = createDemandSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const user = req.user!;

  const thresholds = await V2HtlThresholdModel.find().lean();
  const map = Object.fromEntries(thresholds.map((t: any) => [t.city, t.minCarpetAreaSqFt]));

  const htlEval = evaluateHighTicketLead({
    city: parsed.data.city,
    assetClass: parsed.data.assetClass,
    carpetAreaSqFt: parsed.data.carpetAreaSqFt,
    posterRole: user.role,
    isEnterprisePoster: user.isEnterprise,
    cityThresholdsMap: map
  });

  const autoDeactivatesAt = new Date(
    Date.now() + SLA_CONSTANTS.DEMAND_AUTO_DEACTIVATE_DAYS * 24 * 60 * 60 * 1000
  );

  const demand = await V2DemandModel.create({
    demandId: `DM-${Math.floor(100000 + Math.random() * 900000)}`,
    posterId: user.userId,
    posterRole: user.role,
    posterDisplayName: user.role === USER_ROLES.KD_TEAM ? 'RealEstate Projects' : user.companyName || user.name,
    ...parsed.data,
    isHighTicketLead: htlEval.isExternallyBlackedOut,
    autoDeactivatesAt
  });

  await V2UserModel.findByIdAndUpdate(user.userId, { $inc: { demandsPostedCount: 1 } });
  return res.status(201).json({ demand, htlEval });
});

// 6. Rule-Based Relevancy Matching (EP-013)
app.get('/api/v2/relevancies/demand/:demandId', optionalAuth, requireAuth, async (req, res) => {
  const demand = await V2DemandModel.findOne({ demandId: req.params.demandId }).lean();
  if (!demand) return res.status(404).json({ error: 'DEMAND_NOT_FOUND' });

  const candidates = await V2PropertyModel.find({
    city: new RegExp(`^${demand.city}$`, 'i'),
    assetClass: demand.assetClass,
    status: 'active'
  }).lean();

  const matches = candidates
    .map((prop: any) => {
      const scored = scorePropertyAgainstDemand(demand as any, prop, req.user!.role);
      return scored ? { property: prop, ...scored } : null;
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.score - a.score);

  return res.json({ demandId: demand.demandId, matchCount: matches.length, matches });
});

// 7. Two-Way Contact Reveal & Brand 4-Working-Day / 72h SLA Unlock
app.post('/api/v2/unlock', optionalAuth, requireAuth, async (req, res) => {
  const { targetType, targetListingId } = req.body;
  const user = req.user!;

  const existing = await V2ContactUnlockModel.findOne({ viewerId: user.userId, targetListingId });
  if (existing) return res.json(existing);

  let targetOwnerRole: string;
  let targetOwnerId: unknown;

  if (targetType === 'property') {
    const p = await V2PropertyModel.findOne({ propertyId: targetListingId });
    if (!p) return res.status(404).json({ error: 'PROPERTY_NOT_FOUND' });
    targetOwnerRole = p.ownerRole;
    targetOwnerId = p.ownerId;
  } else {
    const d = await V2DemandModel.findOne({ demandId: targetListingId });
    if (!d) return res.status(404).json({ error: 'DEMAND_NOT_FOUND' });
    targetOwnerRole = d.posterRole;
    targetOwnerId = d.posterId;
    if (d.isHighTicketLead && user.role === USER_ROLES.KD_TEAM) {
      await V2DemandModel.updateOne(
        { _id: d._id },
        { $push: { htlViewedBy: { kdUserId: user.userId, kdUserName: user.name, viewedAt: new Date() } } }
      );
    }
  }

  const isKdViewer = user.role === USER_ROLES.KD_TEAM || user.role === USER_ROLES.SUPER_ADMIN;
  if (!isKdViewer && !user.isEnterprise && !(user.role === USER_ROLES.AGENT && user.isSubscribedAgent)) {
    if (user.contactUnlocksUsed >= 5) {
      return res.status(402).json({ error: 'Kindly subscribe to continue (5 free clicks reached).' });
    }
    await V2UserModel.findByIdAndUpdate(user.userId, { $inc: { contactUnlocksUsed: 1 } });
  }

  const needsBrandApproval =
    !isKdViewer &&
    targetType === 'demand' &&
    (targetOwnerRole === USER_ROLES.RETAIL_BRAND || targetOwnerRole === USER_ROLES.FNB_BRAND);

  const deadlines = needsBrandApproval ? calculateBrandRequestDeadlines() : undefined;

  const unlock = await V2ContactUnlockModel.create({
    viewerId: user.userId,
    targetType,
    targetListingId,
    targetOwnerId,
    mode: isKdViewer ? 'kd_bypass' : needsBrandApproval ? 'brand_approval_required' : 'two_way_reveal',
    status: needsBrandApproval ? 'pending' : 'accepted',
    hardExpiryAt: deadlines?.hardExpiryAt
  });

  return res.status(201).json(unlock);
});

// 8. Activate Agent Subscription (30-Day Cycle)
app.post('/api/v2/subscriptions/activate', optionalAuth, requireAuth, async (req, res) => {
  const { cities = ['Bengaluru'], subtotalInr = 1000 } = req.body;
  const gstInr = Math.round(subtotalInr * SUBSCRIPTION_PRICING_INR.GST_RATE);
  const expiresAt = new Date(Date.now() + SLA_CONSTANTS.SUBSCRIPTION_CYCLE_DAYS * 24 * 60 * 60 * 1000);

  const updated = await V2UserModel.findByIdAndUpdate(
    req.user!.userId,
    {
      isSubscribedAgent: true,
      subscribedCities: cities.map((city: string) => ({ city, tier: 'metro', bundles: ['office'] }))
    },
    { new: true }
  );

  return res.json({
    plan: 'Pro Member',
    expiresAt,
    invoice: { subtotalInr, gstInr, totalPaidInr: subtotalInr + gstInr },
    user: updated
  });
});

async function startServer() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/realestate_projects_v2';
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2500 });
    console.log('[core-services] Connected to MongoDB:', mongoUri);
  } catch (err: any) {
    if (process.env.NODE_ENV === "production") {
      console.error("[db] MongoDB connection failed:", err.message);
      process.exit(1);
    }
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const memServer = await MongoMemoryServer.create();
    await mongoose.connect(memServer.getUri());
    console.log('[core-services] Local MongoDB not detected; running on in-memory MongoDB');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[core-services] REST API listening on http://localhost:${PORT}`);
  });
}

startServer();
