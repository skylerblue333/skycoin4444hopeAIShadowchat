import crypto from 'crypto';
import { db } from './db';
import {
  users,
  posts,
  comments,
  likes,
  follows,
  gameScores,
  achievements,
} from '../drizzle/schema';

/**
 * Realistic seed data for development and testing
 */

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Casey', 'Morgan', 'Riley', 'Taylor', 'Avery',
  'Quinn', 'Blake', 'Drew', 'Skyler', 'Phoenix', 'Dakota', 'River',
];

const LAST_NAMES = [
  'Chen', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
  'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
];

const BIO_TEMPLATES = [
  'Crypto enthusiast | Builder | #Web3',
  'Trading markets | AI researcher | Blockchain',
  'Founder | Investor | Tech lover',
  'Developer | Open source contributor',
  'Artist | Creator | Community builder',
  'Entrepreneur | Innovator | Disruptor',
  'Gamer | Streamer | Content creator',
  'Educator | Mentor | Thought leader',
];

const POST_TEMPLATES = [
  'Just launched my new project! Check it out 🚀',
  'The future of blockchain is here. What are your thoughts?',
  'Building something amazing with AI and crypto',
  'Community is everything. Grateful for this ecosystem',
  'New article on tokenomics and DeFi strategies',
  'Excited to announce our partnership!',
  'Learning something new every day in this space',
  'The best time to build is now',
];

/**
 * Generate random user
 */
function generateUser() {
  const firstName = FIRST_NAMES[Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * LAST_NAMES.length)];
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;

  return {
    email,
    firstName,
    lastName,
    bio: BIO_TEMPLATES[Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * BIO_TEMPLATES.length)],
    profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
    emailVerified: true,
    profileComplete: true,
    createdAt: new Date(Date.now() - (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 90 * 24 * 60 * 60 * 1000),
  };
}

/**
 * Generate random post
 */
function generatePost(userId: string) {
  return {
    userId,
    content: POST_TEMPLATES[Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * POST_TEMPLATES.length)],
    likes: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 1000),
    comments: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 100),
    shares: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 50),
    createdAt: new Date(Date.now() - (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 30 * 24 * 60 * 60 * 1000),
  };
}

/**
 * Seed database with realistic data
 */
export async function seedDatabase() {
  try {
    
    // Create 50 users
    const userIds: string[] = [];
    for (let i = 0; i < 50; i++) {
      const user = generateUser();
      const result = await db.insert(users).values(user);
      userIds.push(result.insertId);
    }
    
    // Create posts for each user
    let postCount = 0;
    for (const userId of userIds) {
      const postsPerUser = Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 5) + 1;
      for (let i = 0; i < postsPerUser; i++) {
        const post = generatePost(userId);
        await db.insert(posts).values(post);
        postCount++;
      }
    }
    
    // Create follows (users following each other)
    let followCount = 0;
    for (let i = 0; i < userIds.length; i++) {
      const followersPerUser = Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 10) + 1;
      for (let j = 0; j < followersPerUser; j++) {
        const followeeIndex = Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * userIds.length);
        if (i !== followeeIndex) {
          await db.insert(follows).values({
            followerId: userIds[i],
            followeeId: userIds[followeeIndex],
            createdAt: new Date(),
          });
          followCount++;
        }
      }
    }
    
    // Create game scores
    let gameScoreCount = 0;
    const gameIds = [
      'crypto-arcade',
      'strategy-game',
      'puzzle-game',
      'mining-game',
      'trading-game',
    ];

    for (const userId of userIds) {
      const gamesPerUser = Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 10) + 1;
      for (let i = 0; i < gamesPerUser; i++) {
        const gameId = gameIds[Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * gameIds.length)];
        await db.insert(gameScores).values({
          userId,
          gameId,
          score: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 10000),
          level: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 50) + 1,
          earnedRewards: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 500),
          playedAt: new Date(Date.now() - (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 30 * 24 * 60 * 60 * 1000),
        });
        gameScoreCount++;
      }
    }
    
    // Award achievements to random users
    let achievementCount = 0;
    const achievementIds = [
      'first-game',
      'level-10',
      'level-50',
      'streak-7',
      'leaderboard-top-10',
      'charity-donor',
    ];

    for (const userId of userIds) {
      const achievementsPerUser = Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 4);
      for (let i = 0; i < achievementsPerUser; i++) {
        const achievementId =
          achievementIds[Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * achievementIds.length)];
        try {
          await db.insert(achievements).values({
            userId,
            achievementId,
            unlockedAt: new Date(Date.now() - (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 30 * 24 * 60 * 60 * 1000),
            reward: Math.floor((crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 500),
          });
          achievementCount++;
        } catch (e) {
          // Duplicate achievement, skip
        }
      }
    }
    
        return {
      success: true,
      stats: {
        users: userIds.length,
        posts: postCount,
        follows: followCount,
        gameScores: gameScoreCount,
        achievements: achievementCount,
      },
    };
  } catch (error) {
        return {
      success: false,
      error: 'Failed to seed database',
    };
  }
}

/**
 * Clear all seed data
 */
export async function clearSeedData() {
  try {
    
    // Delete in order of dependencies
    await db.delete(achievements);
    await db.delete(gameScores);
    await db.delete(likes);
    await db.delete(comments);
    await db.delete(posts);
    await db.delete(follows);
    await db.delete(users);

        return { success: true };
  } catch (error) {
        return { success: false, error: 'Failed to clear seed data' };
  }
}

/**
 * Reseed database (clear and recreate)
 */
export async function reseedDatabase() {
  const clear = await clearSeedData();
  if (!clear.success) return clear;

  return await seedDatabase();
}
