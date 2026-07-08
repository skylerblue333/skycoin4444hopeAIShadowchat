import { AudioSegment } from '@/hooks/useAudioNarration';

/**
 * Comprehensive audio narration content library for SKY444 platform
 * Organized by feature, page, and user journey
 */

export const audioNarrationLibrary = {
  // Onboarding & Welcome
  onboarding: {
    welcome: {
      id: 'onboarding-welcome',
      text: 'Welcome to SKY444, the all-in-one digital ecosystem combining social, finance, gaming, and commerce. Let me guide you through the platform.',
      context: 'Home page welcome',
      priority: 'high',
    } as AudioSegment,
    signup: {
      id: 'onboarding-signup',
      text: 'To get started, create your account with your email or phone number. You can also sign up using Google, Facebook, or Apple. After signup, you will receive a welcome bonus of 1,000 SKY4 tokens.',
      context: 'Sign up page',
      priority: 'high',
    } as AudioSegment,
    profileSetup: {
      id: 'onboarding-profile',
      text: 'Complete your profile by adding a profile picture, bio, and interests. This helps other users find you and improves your personalized experience.',
      context: 'Profile setup',
      priority: 'high',
    } as AudioSegment,
  },

  // Wallet & Crypto
  wallet: {
    overview: {
      id: 'wallet-overview',
      text: 'Your unified wallet displays all your cryptocurrency holdings including SKY4, DOGE, TRUMP, ETH, and BTC. You can view your total portfolio value, 24-hour changes, and detailed transaction history.',
      context: 'Wallet dashboard',
      priority: 'high',
    } as AudioSegment,
    sendCrypto: {
      id: 'wallet-send',
      text: 'To send cryptocurrency, click the Send button, enter the recipient address, amount, and select the cryptocurrency. Review the transaction fee before confirming.',
      context: 'Send crypto',
      priority: 'medium',
    } as AudioSegment,
    receiveCrypto: {
      id: 'wallet-receive',
      text: 'To receive cryptocurrency, click the Receive button to display your wallet address. Share this address with others or scan the QR code for easy sharing.',
      context: 'Receive crypto',
      priority: 'medium',
    } as AudioSegment,
    swapTokens: {
      id: 'wallet-swap',
      text: 'Swap tokens instantly using our integrated exchange. Select the tokens you want to swap, enter the amount, and confirm the transaction. Swaps are completed in seconds.',
      context: 'Swap tokens',
      priority: 'medium',
    } as AudioSegment,
  },

  // Mining & Earning
  mining: {
    overview: {
      id: 'mining-overview',
      text: 'Start mining cryptocurrency and earn passive income. Our platform supports mining for Bitcoin, Ethereum, Solana, Dogecoin, and Trump tokens. Mining rewards are automatically deposited to your wallet.',
      context: 'Mining dashboard',
      priority: 'high',
    } as AudioSegment,
    startMining: {
      id: 'mining-start',
      text: 'To start mining, select your preferred cryptocurrency, set your mining power, and click Start. Monitor your mining progress and earnings in real-time.',
      context: 'Start mining',
      priority: 'high',
    } as AudioSegment,
    miningStats: {
      id: 'mining-stats',
      text: 'View detailed mining statistics including hash rate, shares submitted, estimated earnings, and mining duration. Optimize your mining settings for maximum profitability.',
      context: 'Mining statistics',
      priority: 'medium',
    } as AudioSegment,
  },

  // Social & Community
  social: {
    feed: {
      id: 'social-feed',
      text: 'Your personalized feed displays posts from people you follow, trending content, and recommended posts. Like, comment, and share posts to engage with the community.',
      context: 'Social feed',
      priority: 'high',
    } as AudioSegment,
    createPost: {
      id: 'social-create',
      text: 'Create a new post by clicking the Create button. Add text, images, videos, or links. You can also add hashtags and mention other users. Posts are instantly shared with your followers.',
      context: 'Create post',
      priority: 'high',
    } as AudioSegment,
    messaging: {
      id: 'social-messaging',
      text: 'Send direct messages to other users. Start a new conversation, share media, and enjoy real-time messaging. Your conversations are encrypted and private.',
      context: 'Messaging',
      priority: 'medium',
    } as AudioSegment,
  },

  // Gaming
  gaming: {
    overview: {
      id: 'gaming-overview',
      text: 'Play exciting games and earn cryptocurrency rewards. Our game hub features arcade games, strategy games, and puzzle games. Compete with other players on global leaderboards.',
      context: 'Game hub',
      priority: 'high',
    } as AudioSegment,
    cryptoArcade: {
      id: 'gaming-arcade',
      text: 'Play fast-paced arcade games and earn SKY4 tokens. The higher your score, the more tokens you earn. Daily challenges offer bonus rewards.',
      context: 'Crypto Arcade',
      priority: 'medium',
    } as AudioSegment,
    leaderboards: {
      id: 'gaming-leaderboards',
      text: 'View global, regional, and friend leaderboards. Compete with other players and climb the rankings. Top players receive weekly rewards.',
      context: 'Leaderboards',
      priority: 'medium',
    } as AudioSegment,
  },

  // Marketplace
  marketplace: {
    overview: {
      id: 'marketplace-overview',
      text: 'Browse our curated marketplace featuring premium products, electronics, fashion, and more. All products are carefully selected and verified for quality.',
      context: 'Marketplace',
      priority: 'high',
    } as AudioSegment,
    productSearch: {
      id: 'marketplace-search',
      text: 'Search for products using keywords, categories, or filters. View detailed product information, customer reviews, and ratings before making a purchase.',
      context: 'Product search',
      priority: 'medium',
    } as AudioSegment,
    checkout: {
      id: 'marketplace-checkout',
      text: 'Complete your purchase in our secure checkout. Add items to your cart, enter shipping information, select payment method, and confirm your order.',
      context: 'Checkout',
      priority: 'high',
    } as AudioSegment,
  },

  // Creator Features
  creator: {
    overview: {
      id: 'creator-overview',
      text: 'Monetize your content and earn from your audience. Track your earnings, manage subscriptions, and access creator tools to grow your audience.',
      context: 'Creator dashboard',
      priority: 'high',
    } as AudioSegment,
    monetization: {
      id: 'creator-monetization',
      text: 'Earn money from multiple sources including subscriptions, tips, sponsored content, and merchandise sales. View detailed earnings breakdown by source.',
      context: 'Creator monetization',
      priority: 'high',
    } as AudioSegment,
    analytics: {
      id: 'creator-analytics',
      text: 'Analyze your content performance with detailed analytics. Track views, engagement, follower growth, and revenue trends over time.',
      context: 'Creator analytics',
      priority: 'medium',
    } as AudioSegment,
  },

  // Dating
  dating: {
    overview: {
      id: 'dating-overview',
      text: 'Meet new people on our dating platform. Browse profiles, like matches, and start conversations with people you are interested in.',
      context: 'Dating home',
      priority: 'high',
    } as AudioSegment,
    discover: {
      id: 'dating-discover',
      text: 'Discover potential matches based on your preferences. Swipe right to like, left to pass, or superlike your favorites. Matches happen when both users like each other.',
      context: 'Dating discovery',
      priority: 'high',
    } as AudioSegment,
    messaging: {
      id: 'dating-messaging',
      text: 'Chat with your matches in real-time. Share photos, videos, and voice messages. Plan dates and get to know each other better.',
      context: 'Dating messaging',
      priority: 'medium',
    } as AudioSegment,
  },

  // Settings & Account
  settings: {
    overview: {
      id: 'settings-overview',
      text: 'Manage your account settings, privacy preferences, and notification settings. Update your profile information and security settings.',
      context: 'Settings',
      priority: 'medium',
    } as AudioSegment,
    security: {
      id: 'settings-security',
      text: 'Enhance your account security with two-factor authentication, password management, and login activity monitoring. Review trusted devices and active sessions.',
      context: 'Security settings',
      priority: 'high',
    } as AudioSegment,
    privacy: {
      id: 'settings-privacy',
      text: 'Control your privacy settings including profile visibility, message permissions, and data sharing preferences. Manage who can see your content and contact you.',
      context: 'Privacy settings',
      priority: 'high',
    } as AudioSegment,
  },

  // Features & Help
  features: {
    aiAssistant: {
      id: 'features-ai',
      text: 'Meet Hope AI, your personal assistant. Ask Hope AI to stake tokens, buy products, tip creators, launch campaigns, or execute trades. Hope AI understands natural language commands.',
      context: 'AI assistant',
      priority: 'high',
    } as AudioSegment,
    notifications: {
      id: 'features-notifications',
      text: 'Stay updated with real-time notifications. Receive alerts for messages, likes, follows, mining rewards, and marketplace updates. Customize your notification preferences.',
      context: 'Notifications',
      priority: 'medium',
    } as AudioSegment,
    support: {
      id: 'features-support',
      text: 'Need help? Access our comprehensive help center with FAQs, tutorials, and guides. Submit support tickets for technical issues or contact our support team.',
      context: 'Help center',
      priority: 'medium',
    } as AudioSegment,
  },
};

/**
 * Get audio narration for a specific page or feature
 */
export const getAudioNarration = (category: string, key: string): AudioSegment | null => {
  const categoryContent = audioNarrationLibrary[category as keyof typeof audioNarrationLibrary];
  if (!categoryContent) return null;

  return categoryContent[key as keyof typeof categoryContent] || null;
};

/**
 * Get all audio narrations for a category
 */
export const getCategoryNarrations = (category: string): AudioSegment[] => {
  const categoryContent = audioNarrationLibrary[category as keyof typeof audioNarrationLibrary];
  if (!categoryContent) return [];

  return Object.values(categoryContent) as AudioSegment[];
};

/**
 * Get all high-priority narrations for onboarding
 */
export const getOnboardingNarrations = (): AudioSegment[] => {
  const allNarrations: AudioSegment[] = [];

  Object.values(audioNarrationLibrary).forEach(category => {
    Object.values(category).forEach(narration => {
      if (narration.priority === 'high') {
        allNarrations.push(narration);
      }
    });
  });

  return allNarrations;
};

export default audioNarrationLibrary;
