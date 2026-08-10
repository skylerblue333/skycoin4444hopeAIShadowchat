import crypto from 'crypto';
import { Router } from 'express';
import { db } from './db';
import { datingSubscriptions, datingPreferences, users } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Subscription tiers with features
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    currency: 'USD',
    features: {
      unlimitedLikes: false,
      unlimitedSuperLikes: false,
      unlimitedMessages: false,
      rewindFeature: false,
      boostFeature: false,
      incognitoMode: false,
      advancedFilters: false,
      seenByFeature: false,
      dailyLikes: 10,
      dailySuperLikes: 1,
    },
  },
  premium: {
    name: 'Premium',
    price: 9.99,
    currency: 'USD',
    features: {
      unlimitedLikes: true,
      unlimitedSuperLikes: false,
      unlimitedMessages: true,
      rewindFeature: true,
      boostFeature: true,
      incognitoMode: false,
      advancedFilters: true,
      seenByFeature: false,
      dailyLikes: -1, // unlimited
      dailySuperLikes: 5,
    },
  },
  vip: {
    name: 'VIP',
    price: 24.99,
    currency: 'USD',
    features: {
      unlimitedLikes: true,
      unlimitedSuperLikes: true,
      unlimitedMessages: true,
      rewindFeature: true,
      boostFeature: true,
      incognitoMode: true,
      advancedFilters: true,
      seenByFeature: true,
      dailyLikes: -1,
      dailySuperLikes: -1,
    },
  },
  elite: {
    name: 'Elite',
    price: 49.99,
    currency: 'USD',
    features: {
      unlimitedLikes: true,
      unlimitedSuperLikes: true,
      unlimitedMessages: true,
      rewindFeature: true,
      boostFeature: true,
      incognitoMode: true,
      advancedFilters: true,
      seenByFeature: true,
      dailyLikes: -1,
      dailySuperLikes: -1,
      prioritySupport: true,
      premiumBadge: true,
      aiMatchingBoost: true,
    },
  },
};

// Get user subscription
router.get('/api/dating/subscription', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const subscription = await db
      .select()
      .from(datingSubscriptions)
      .where(eq(datingSubscriptions.userId, userId));

    if (!subscription.length) {
      return res.json({
        tier: 'free',
        status: 'active',
        features: SUBSCRIPTION_TIERS.free.features,
      });
    }

    const sub = subscription[0];
    const tierFeatures = SUBSCRIPTION_TIERS[sub.tier as keyof typeof SUBSCRIPTION_TIERS];

    res.json({
      ...sub,
      features: tierFeatures?.features || {},
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Get subscription plans
router.get('/api/dating/subscription/plans', async (req: any, res) => {
  try {
    const plans = Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => ({
      id: key,
      ...tier,
    }));

    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// Create Stripe checkout session
router.post('/api/dating/subscription/checkout', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { tier } = req.body;
    const tierData = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];

    if (!tierData) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

        // For now, return mock checkout URL
    const checkoutUrl = `https://checkout.stripe.com/pay/cs_test_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).substr(2, 9)}`;

    res.json({
      checkoutUrl,
      tier,
      price: tierData.price,
      currency: tierData.currency,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Webhook for Stripe subscription updates
router.post('/api/dating/subscription/webhook', async (req: any, res) => {
  try {
    const { event_type, subscription_id, customer_id, status, tier } = req.body;

    
    if (event_type === 'customer.subscription.created') {
      // Find user by Stripe customer ID and create subscription
      // This requires mapping users to Stripe customer IDs
    } else if (event_type === 'customer.subscription.updated') {
      // Update subscription tier/status
      await db
        .update(datingSubscriptions)
        .set({
          status: status as any,
          tier: tier as any,
          updatedAt: new Date(),
        })
        .where(eq(datingSubscriptions.stripeSubscriptionId, subscription_id));
    } else if (event_type === 'customer.subscription.deleted') {
      // Cancel subscription
      await db
        .update(datingSubscriptions)
        .set({
          status: 'cancelled',
          cancelledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(datingSubscriptions.stripeSubscriptionId, subscription_id));
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Upgrade subscription
router.post('/api/dating/subscription/upgrade', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { tier } = req.body;
    const tierData = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];

    if (!tierData) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    const existing = await db
      .select()
      .from(datingSubscriptions)
      .where(eq(datingSubscriptions.userId, userId));

    if (existing.length) {
      await db
        .update(datingSubscriptions)
        .set({
          tier: tier as any,
          status: 'active',
          price: tierData.price.toString() as any,
          unlimitedLikes: tierData.features.unlimitedLikes,
          unlimitedSuperLikes: tierData.features.unlimitedSuperLikes,
          unlimitedMessages: tierData.features.unlimitedMessages,
          rewindFeature: tierData.features.rewindFeature,
          boostFeature: tierData.features.boostFeature,
          incognitoMode: tierData.features.incognitoMode,
          advancedFilters: tierData.features.advancedFilters,
          seenByFeature: tierData.features.seenByFeature,
          startsAt: new Date(),
          endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          updatedAt: new Date(),
        })
        .where(eq(datingSubscriptions.userId, userId));
    } else {
      await db.insert(datingSubscriptions).values({
        userId,
        tier: tier as any,
        status: 'active',
        price: tierData.price.toString() as any,
        currency: tierData.currency,
        unlimitedLikes: tierData.features.unlimitedLikes,
        unlimitedSuperLikes: tierData.features.unlimitedSuperLikes,
        unlimitedMessages: tierData.features.unlimitedMessages,
        rewindFeature: tierData.features.rewindFeature,
        boostFeature: tierData.features.boostFeature,
        incognitoMode: tierData.features.incognitoMode,
        advancedFilters: tierData.features.advancedFilters,
        seenByFeature: tierData.features.seenByFeature,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
    }

    res.json({ success: true, tier, message: 'Subscription upgraded successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upgrade subscription' });
  }
});

// Cancel subscription
router.post('/api/dating/subscription/cancel', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await db
      .update(datingSubscriptions)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(datingSubscriptions.userId, userId));

    res.json({ success: true, message: 'Subscription cancelled' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Check feature access
export async function hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
  const subscription = await db
    .select()
    .from(datingSubscriptions)
    .where(eq(datingSubscriptions.userId, userId));

  if (!subscription.length) {
    return SUBSCRIPTION_TIERS.free.features[feature as keyof typeof SUBSCRIPTION_TIERS.free.features] === true;
  }

  const sub = subscription[0];
  const tierFeatures = SUBSCRIPTION_TIERS[sub.tier as keyof typeof SUBSCRIPTION_TIERS];

  if (!tierFeatures) return false;

  return tierFeatures.features[feature as keyof typeof tierFeatures.features] === true;
}

// Check daily limits
export async function checkDailyLimit(userId: string, limitType: 'likes' | 'superLikes'): Promise<boolean> {
  const subscription = await db
    .select()
    .from(datingSubscriptions)
    .where(eq(datingSubscriptions.userId, userId));

  const tier = subscription.length ? subscription[0].tier : 'free';
  const tierData = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];

  if (!tierData) return false;

  const limit = limitType === 'likes' ? tierData.features.dailyLikes : tierData.features.dailySuperLikes;

  // -1 means unlimited
  if (limit === -1) return true;

    // For now, assume user hasn't exceeded limit
  return true;
}

export default router;
