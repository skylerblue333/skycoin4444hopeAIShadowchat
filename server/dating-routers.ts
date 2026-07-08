import { Router } from 'express';
import datingNotificationsRouter from './dating-notifications';
import datingSubscriptionsRouter from './dating-subscriptions';
import { db } from './db';
import { datingProfiles, datingMatches, datingLikes, datingMessages } from '../drizzle/schema';
import { eq, and, ne, or as drizzleOr } from 'drizzle-orm';
import {
  getRecommendedMatches,
  analyzeProfileForImprovements,
  generateConversationStarters,
} from './dating-ai-matching';
import { hasFeatureAccess, checkDailyLimit } from './dating-subscriptions';

const router = Router();

// Mount sub-routers
router.use(datingNotificationsRouter);
router.use(datingSubscriptionsRouter);

// Get dating profile
router.get('/api/dating/profile', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const profile = await db
      .select()
      .from(datingProfiles)
      .where(eq(datingProfiles.userId, userId));

    if (!profile.length) {
      return res.json({ profile: null });
    }

    res.json({ profile: profile[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update dating profile
router.patch('/api/dating/profile', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      age,
      gender,
      lookingFor,
      bio,
      interests,
      photos,
      height,
      bodyType,
      ethnicity,
      religion,
      education,
      occupation,
      smoker,
      drinker,
      hasKids,
      wantsKids,
      relationshipGoal,
    } = req.body;

    // Calculate profile completeness
    const fields = [
      age,
      gender,
      lookingFor,
      bio,
      interests,
      photos,
      height,
      bodyType,
      education,
      occupation,
      relationshipGoal,
    ];
    const completeness = Math.round((fields.filter((f) => f).length / fields.length) * 100);

    const existing = await db
      .select()
      .from(datingProfiles)
      .where(eq(datingProfiles.userId, userId));

    if (existing.length) {
      await db
        .update(datingProfiles)
        .set({
          age,
          gender,
          lookingFor,
          bio,
          interests,
          photos,
          height,
          bodyType,
          ethnicity,
          religion,
          education,
          occupation,
          smoker,
          drinker,
          hasKids,
          wantsKids,
          relationshipGoal,
          profileCompleteness: completeness,
          updatedAt: new Date(),
        })
        .where(eq(datingProfiles.userId, userId));
    } else {
      await db.insert(datingProfiles).values({
        userId,
        age,
        gender,
        lookingFor,
        bio,
        interests,
        photos,
        height,
        bodyType,
        ethnicity,
        religion,
        education,
        occupation,
        smoker,
        drinker,
        hasKids,
        wantsKids,
        relationshipGoal,
        profileCompleteness: completeness,
      });
    }

    res.json({ success: true, completeness });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get recommended matches
router.get('/api/dating/matches/recommended', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const limit = Math.min(parseInt(req.query.limit || '10'), 50);
    const matches = await getRecommendedMatches(userId, limit);

    res.json({ matches });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recommended matches' });
  }
});

// Like user
router.post('/api/dating/like/:targetUserId', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const targetUserId = parseInt(req.params.targetUserId);

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (userId === targetUserId) return res.status(400).json({ error: 'Cannot like yourself' });

    // Check feature access
    const hasAccess = await hasFeatureAccess(userId, 'unlimitedLikes');
    if (!hasAccess) {
      const canLike = await checkDailyLimit(userId, 'likes');
      if (!canLike) {
        return res.status(429).json({ error: 'Daily like limit exceeded' });
      }
    }

    // Check if already liked
    const existing = await db
      .select()
      .from(datingLikes)
      .where(and(eq(datingLikes.userId, userId), eq(datingLikes.likedUserId, targetUserId)));

    if (existing.length) {
      return res.status(400).json({ error: 'Already liked this user' });
    }

    // Create like
    await db.insert(datingLikes).values({
      userId,
      likedUserId: targetUserId,
      type: 'like',
    });

    // Check for mutual like (match)
    const mutualLike = await db
      .select()
      .from(datingLikes)
      .where(and(eq(datingLikes.userId, targetUserId), eq(datingLikes.likedUserId, userId)));

    if (mutualLike.length) {
      // Create match
      const match = await db.insert(datingMatches).values({
        user1Id: Math.min(userId, targetUserId),
        user2Id: Math.max(userId, targetUserId),
        matchType: 'mutual_like',
        isMutual: true,
      });

      return res.json({ success: true, matched: true });
    }

    res.json({ success: true, matched: false });
  } catch (error) {
    res.status(500).json({ error: 'Failed to like user' });
  }
});

// Super like user
router.post('/api/dating/superlike/:targetUserId', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const targetUserId = parseInt(req.params.targetUserId);

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (userId === targetUserId) return res.status(400).json({ error: 'Cannot superlike yourself' });

    // Check feature access
    const hasAccess = await hasFeatureAccess(userId, 'unlimitedSuperLikes');
    if (!hasAccess) {
      const canSuperLike = await checkDailyLimit(userId, 'superLikes');
      if (!canSuperLike) {
        return res.status(429).json({ error: 'Daily super like limit exceeded' });
      }
    }

    // Check if already liked
    const existing = await db
      .select()
      .from(datingLikes)
      .where(and(eq(datingLikes.userId, userId), eq(datingLikes.likedUserId, targetUserId)));

    if (existing.length) {
      return res.status(400).json({ error: 'Already liked this user' });
    }

    // Create super like
    await db.insert(datingLikes).values({
      userId,
      likedUserId: targetUserId,
      type: 'superlike',
    });

    // Check for mutual superlike (match)
    const mutualLike = await db
      .select()
      .from(datingLikes)
      .where(and(eq(datingLikes.userId, targetUserId), eq(datingLikes.likedUserId, userId)));

    if (mutualLike.length) {
      // Create match
      await db.insert(datingMatches).values({
        user1Id: Math.min(userId, targetUserId),
        user2Id: Math.max(userId, targetUserId),
        matchType: 'mutual_superlike',
        isMutual: true,
      });

      return res.json({ success: true, matched: true });
    }

    res.json({ success: true, matched: false });
  } catch (error) {
    res.status(500).json({ error: 'Failed to superlike user' });
  }
});

// Pass on user
router.post('/api/dating/pass/:targetUserId', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const targetUserId = parseInt(req.params.targetUserId);

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Create pass record
    const existing = await db
      .select()
      .from(datingLikes)
      .where(and(eq(datingLikes.userId, userId), eq(datingLikes.likedUserId, targetUserId)));

    if (!existing.length) {
      await db.insert(datingLikes).values({
        userId,
        likedUserId: targetUserId,
        type: 'pass',
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to pass on user' });
  }
});

// Get matches
router.get('/api/dating/matches', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const matches = await db
      .select()
      .from(datingMatches)
      .where(
        and(
          drizzleOr(
            eq(datingMatches.user1Id, userId),
            eq(datingMatches.user2Id, userId)
          ),
          eq(datingMatches.isBlocked, false)
        )
      );

    res.json({ matches });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Send message
router.post('/api/dating/messages', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { matchId, content, mediaUrl, mediaType } = req.body;

    // Check feature access
    const hasAccess = await hasFeatureAccess(userId, 'unlimitedMessages');
    if (!hasAccess) {
      return res.status(429).json({ error: 'Message limit exceeded' });
    }

    const message = await db.insert(datingMessages).values({
      matchId,
      senderId: userId,
      recipientId: 0, // Will be set from match
      content,
      mediaUrl,
      mediaType,
    });

    res.json({ success: true, messageId: message });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get conversation
router.get('/api/dating/conversations/:matchId', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const matchId = parseInt(req.params.matchId);

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const messages = await db
      .select()
      .from(datingMessages)
      .where(eq(datingMessages.matchId, matchId));

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Get profile improvement suggestions
router.get('/api/dating/profile/suggestions', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const suggestions = await analyzeProfileForImprovements(userId);

    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// Get conversation starters
router.get('/api/dating/conversation-starters/:matchUserId', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const matchUserId = parseInt(req.params.matchUserId);

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const starters = await generateConversationStarters(userId, matchUserId);

    res.json({ starters });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate conversation starters' });
  }
});



export default router;
