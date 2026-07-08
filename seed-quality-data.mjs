#!/usr/bin/env node

/**
 * Quality-Focused Seed Data Generation
 * Creates realistic, high-quality seed data for SKY444 platform
 * Focus: Authenticity, visual appeal, and meaningful engagement
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DATABASE_URL?.split('@')[1]?.split(':')[0] || 'localhost',
  user: process.env.DATABASE_URL?.split('//')[1]?.split(':')[0] || 'root',
  password: process.env.DATABASE_URL?.split(':')[2]?.split('@')[0] || '',
  database: process.env.DATABASE_URL?.split('/')[3]?.split('?')[0] || 'skycoin',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

// Premium user profiles with authentic bios
const PREMIUM_USERS = [
  {
    id: 'user_skyler_founder',
    email: 'skyler@skycoin4444.com',
    name: 'Skyler Blue Spillers',
    bio: 'Founder & CEO of SKY444 | CEH | M.S. Cybersecurity | Building the future of decentralized AI',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=skyler',
    role: 'admin',
    verified: true,
    followers: 15420,
    following: 342,
  },
  {
    id: 'user_hope_ai',
    email: 'hope@skycoin4444.com',
    name: 'Hope AI',
    bio: 'Advanced AI Engine powering SKY444 | Real-time code generation, analysis & insights',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=hope',
    role: 'admin',
    verified: true,
    followers: 8932,
    following: 145,
  },
  {
    id: 'user_crypto_trader',
    email: 'trader@example.com',
    name: 'Alex Chen',
    bio: 'Crypto trader | Day trading strategies | SKY444 early adopter | 5+ years in crypto',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
    role: 'user',
    verified: true,
    followers: 3421,
    following: 892,
  },
  {
    id: 'user_content_creator',
    email: 'creator@example.com',
    name: 'Jordan Mitchell',
    bio: 'Content Creator | Tech Enthusiast | Building community on SKY444 | Creator Studio Partner',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jordan',
    role: 'user',
    verified: true,
    followers: 5643,
    following: 1203,
  },
  {
    id: 'user_gaming_pro',
    email: 'gamer@example.com',
    name: 'Sam Rodriguez',
    bio: 'Professional gamer | SKY444 Arcade champion | Streaming daily | Crypto rewards enthusiast',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sam',
    role: 'user',
    verified: true,
    followers: 7821,
    following: 654,
  },
];

// High-quality posts showcasing platform features
const QUALITY_POSTS = [
  {
    userId: 'user_skyler_founder',
    content: 'Excited to announce SKY444 is now live! 🚀 A fully integrated AI-powered ecosystem combining crypto, social, gaming, and professional IT services. Join us on the journey to April 2027 ICO launch. #SKY444 #Crypto #AI',
    likes: 1243,
    comments: 89,
    shares: 342,
  },
  {
    userId: 'user_hope_ai',
    content: 'Just processed 1M+ lines of code across the SKY444 ecosystem. Real-time AI analysis, security audits, and optimization suggestions available now. Experience the future of development. 🤖',
    likes: 892,
    comments: 156,
    shares: 234,
  },
  {
    userId: 'user_crypto_trader',
    content: 'SKY444 mining just hit $2.5K daily earnings! 📈 The parallel processing engine is insane. Anyone else seeing these numbers? #Mining #Crypto #SKY444',
    likes: 2134,
    comments: 421,
    shares: 567,
  },
  {
    userId: 'user_content_creator',
    content: 'Using Creator Studio to monetize my content on SKY444. First week earnings: $1,200 in SKY444 tokens + DOGE rewards. This is game-changing! 💰',
    likes: 1567,
    comments: 234,
    shares: 456,
  },
  {
    userId: 'user_gaming_pro',
    content: 'Just won the SKY444 Arcade championship! 🏆 Earned 50,000 XP and 500 SKY444 tokens. The gamification on this platform is next level. Who\'s up for a challenge?',
    likes: 3421,
    comments: 567,
    shares: 892,
  },
];

// Premium game data with realistic progression
const GAME_SCORES = [
  { userId: 'user_gaming_pro', game: 'crypto_arcade', score: 125400, rank: 1, achievements: 28 },
  { userId: 'user_crypto_trader', game: 'strategy_game', score: 98500, rank: 2, achievements: 22 },
  { userId: 'user_content_creator', game: 'puzzle_game', score: 87300, rank: 3, achievements: 19 },
  { userId: 'user_skyler_founder', game: 'crypto_arcade', score: 76200, rank: 4, achievements: 15 },
];

// Curated marketplace products (discreetly integrated DHGate items)
const MARKETPLACE_PRODUCTS = [
  {
    name: 'Premium Wireless Headphones',
    description: 'High-quality audio with noise cancellation. Perfect for creators and professionals.',
    price: 45.99,
    category: 'electronics',
    rating: 4.8,
    reviews: 342,
    image: 'https://api.dicebear.com/7.x/shapes/svg?seed=product1',
  },
  {
    name: 'Luxury Watch Collection',
    description: 'Elegant timepiece with premium materials. Timeless design for any occasion.',
    price: 89.99,
    category: 'accessories',
    rating: 4.9,
    reviews: 567,
    image: 'https://api.dicebear.com/7.x/shapes/svg?seed=product2',
  },
  {
    name: 'Professional Camera Lens',
    description: 'Crystal clear imaging for content creators. Wide angle and macro capabilities.',
    price: 129.99,
    category: 'electronics',
    rating: 4.7,
    reviews: 421,
    image: 'https://api.dicebear.com/7.x/shapes/svg?seed=product3',
  },
  {
    name: 'Designer Sunglasses',
    description: 'UV protection with premium frames. Perfect for outdoor activities and travel.',
    price: 59.99,
    category: 'accessories',
    rating: 4.8,
    reviews: 289,
    image: 'https://api.dicebear.com/7.x/shapes/svg?seed=product4',
  },
  {
    name: 'Smart Home Hub',
    description: 'Control your entire home with voice commands. Compatible with all major systems.',
    price: 99.99,
    category: 'electronics',
    rating: 4.6,
    reviews: 634,
    image: 'https://api.dicebear.com/7.x/shapes/svg?seed=product5',
  },
];

async function seedQualityData() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🌱 Starting quality-focused seed data generation...\n');

    // Seed premium users
    console.log('📝 Seeding premium user profiles...');
    for (const user of PREMIUM_USERS) {
      await connection.execute(
        `INSERT IGNORE INTO users (id, email, name, bio, avatar, role, verified, followers, following, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [user.id, user.email, user.name, user.bio, user.avatar, user.role, user.verified, user.followers, user.following]
      );
    }
    console.log(`✅ Seeded ${PREMIUM_USERS.length} premium user profiles\n`);

    // Seed quality posts
    console.log('📰 Seeding high-quality posts...');
    for (const post of QUALITY_POSTS) {
      await connection.execute(
        `INSERT INTO posts (user_id, content, likes, comments, shares, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [post.userId, post.content, post.likes, post.comments, post.shares]
      );
    }
    console.log(`✅ Seeded ${QUALITY_POSTS.length} high-quality posts\n`);

    // Seed game data
    console.log('🎮 Seeding game scores and achievements...');
    for (const score of GAME_SCORES) {
      await connection.execute(
        `INSERT INTO game_scores (user_id, game_name, score, rank, achievements, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [score.userId, score.game, score.score, score.rank, score.achievements]
      );
    }
    console.log(`✅ Seeded ${GAME_SCORES.length} game scores\n`);

    // Seed marketplace products
    console.log('🛍️  Seeding curated marketplace products...');
    for (const product of MARKETPLACE_PRODUCTS) {
      await connection.execute(
        `INSERT INTO marketplace_products (name, description, price, category, rating, reviews, image_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [product.name, product.description, product.price, product.category, product.rating, product.reviews, product.image]
      );
    }
    console.log(`✅ Seeded ${MARKETPLACE_PRODUCTS.length} curated products\n`);

    console.log('🎉 Quality seed data generation complete!');
    console.log('\n📊 Summary:');
    console.log(`   • Premium user profiles: ${PREMIUM_USERS.length}`);
    console.log(`   • High-quality posts: ${QUALITY_POSTS.length}`);
    console.log(`   • Game scores: ${GAME_SCORES.length}`);
    console.log(`   • Marketplace products: ${MARKETPLACE_PRODUCTS.length}`);
    console.log('\n✨ Platform is ready for testing with authentic, high-quality data!');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await connection.release();
    await pool.end();
  }
}

// Run seeding
seedQualityData().catch(console.error);
