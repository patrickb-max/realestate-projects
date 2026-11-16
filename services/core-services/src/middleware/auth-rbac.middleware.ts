import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { V2UserModel } from '@reprojects/database';
import type { AuthUserContext } from '@reprojects/types';

declare global { namespace Express { interface Request { user?: AuthUserContext; } } }

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, 'DEV_SECRET') as { userId: string };
      const user = await V2UserModel.findById(decoded.userId).lean();
      if (user && user.accountStatus !== 'deleted') {
        req.user = {
          userId: user._id.toString(),
          role: user.role as any,
          accountStatus: user.accountStatus,
          isEnterprise: user.isEnterprise,
          isSubscribedAgent: user.isSubscribedAgent,
          subscribedBundles: [],
          subscribedCities: user.subscribedCities.map((c: any) => c.city),
          isPanIndia: false,
          name: user.name,
          mobile: user.mobile,
          contactUnlocksUsed: user.contactUnlocksUsed
        };
      }
    } catch {}
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'AUTH_REQUIRED', message: 'Please sign in.' });
  if (req.user.accountStatus === 'deactivated') return res.status(403).json({ error: 'ACCOUNT_DEACTIVATED' });
  next();
}
