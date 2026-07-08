CREATE TABLE `achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`icon` text,
	`category` varchar(50),
	`xpReward` int NOT NULL DEFAULT 0,
	`rarity` enum('common','uncommon','rare','epic','legendary') NOT NULL DEFAULT 'common',
	`requirement` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('trend','sentiment','prediction','recommendation','fraud_alert') NOT NULL,
	`category` varchar(50),
	`data` json NOT NULL,
	`confidence` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `channel_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channelId` int NOT NULL,
	`authorId` int NOT NULL,
	`content` text NOT NULL,
	`mediaUrl` text,
	`replyToId` int,
	`isPinned` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `channel_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `channels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`communityId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`type` enum('text','voice','video','announcements','stage') NOT NULL DEFAULT 'text',
	`description` text,
	`isPrivate` boolean NOT NULL DEFAULT false,
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `channels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `charity_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`imageUrl` text,
	`goalAmount` decimal(18,4) NOT NULL,
	`raisedAmount` decimal(18,4) NOT NULL DEFAULT '0',
	`currency` varchar(20) NOT NULL DEFAULT 'SKY444',
	`category` varchar(50),
	`walletAddress` varchar(128),
	`status` enum('active','completed','cancelled') NOT NULL DEFAULT 'active',
	`donorCount` int NOT NULL DEFAULT 0,
	`isVerified` boolean NOT NULL DEFAULT false,
	`endsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `charity_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `charity_donations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`donorId` int NOT NULL,
	`amount` decimal(18,4) NOT NULL,
	`currency` varchar(20) NOT NULL DEFAULT 'SKY444',
	`message` text,
	`isAnonymous` boolean NOT NULL DEFAULT false,
	`txHash` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `charity_donations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `charity_votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`userId` int NOT NULL,
	`vote` enum('approve','reject') NOT NULL,
	`weight` decimal(18,4) NOT NULL DEFAULT '1',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `charity_votes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`authorId` int NOT NULL,
	`parentId` int,
	`content` text NOT NULL,
	`likeCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`avatar` text,
	`banner` text,
	`ownerId` int NOT NULL,
	`type` enum('public','private','token_gated','premium','dao') NOT NULL DEFAULT 'public',
	`category` varchar(50),
	`memberCount` int NOT NULL DEFAULT 0,
	`isVerified` boolean NOT NULL DEFAULT false,
	`tokenGateAddress` varchar(128),
	`tokenGateMinBalance` decimal(18,4),
	`settings` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `communities_id` PRIMARY KEY(`id`),
	CONSTRAINT `communities_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `community_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`communityId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('member','moderator','admin','owner') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creator_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int NOT NULL,
	`subscriberId` int NOT NULL,
	`tier` enum('supporter','premium','vip') NOT NULL DEFAULT 'supporter',
	`price` decimal(10,2) NOT NULL,
	`currency` varchar(20) NOT NULL DEFAULT 'SKY444',
	`status` enum('active','cancelled','expired') NOT NULL DEFAULT 'active',
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creator_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `follows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`followerId` int NOT NULL,
	`followingId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `follows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hashtags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tag` varchar(100) NOT NULL,
	`postCount` int NOT NULL DEFAULT 0,
	`trendScore` decimal(10,2) DEFAULT '0',
	`isTrending` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hashtags_id` PRIMARY KEY(`id`),
	CONSTRAINT `hashtags_tag_unique` UNIQUE(`tag`)
);
--> statement-breakpoint
CREATE TABLE `likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`postId` int,
	`commentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sellerId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`type` enum('nft','digital_asset','merch','subscription','service','gaming_item') NOT NULL,
	`price` decimal(18,4) NOT NULL,
	`currency` varchar(20) NOT NULL DEFAULT 'SKY444',
	`imageUrl` text,
	`mediaUrls` json,
	`category` varchar(50),
	`status` enum('active','sold','cancelled','expired') NOT NULL DEFAULT 'active',
	`isAuction` boolean NOT NULL DEFAULT false,
	`auctionEndsAt` timestamp,
	`highestBid` decimal(18,4),
	`highestBidderId` int,
	`viewCount` int NOT NULL DEFAULT 0,
	`likeCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `listings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `moderation_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`targetType` enum('post','comment','user','stream','listing','message') NOT NULL,
	`targetId` int NOT NULL,
	`action` enum('flag','remove','warn','ban','approve') NOT NULL,
	`reason` text,
	`moderatorId` int,
	`isAiAction` boolean NOT NULL DEFAULT false,
	`confidence` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `moderation_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('follow','like','comment','mention','repost','donation','achievement','stream_live','tournament','system') NOT NULL,
	`title` varchar(200) NOT NULL,
	`message` text,
	`actorId` int,
	`targetType` varchar(50),
	`targetId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`buyerId` int NOT NULL,
	`sellerId` int NOT NULL,
	`listingId` int NOT NULL,
	`amount` decimal(18,4) NOT NULL,
	`currency` varchar(20) NOT NULL,
	`status` enum('pending','escrow','completed','refunded','disputed') NOT NULL DEFAULT 'pending',
	`txHash` varchar(128),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int NOT NULL,
	`amount` decimal(18,4) NOT NULL,
	`currency` varchar(20) NOT NULL,
	`type` enum('subscription','tip','donation','marketplace','ad_revenue','tournament') NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`txHash` varchar(128),
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platform_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metric` varchar(50) NOT NULL,
	`value` decimal(24,8) NOT NULL,
	`category` varchar(50),
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `platform_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`type` enum('text','image','video','reel','story','article','poll') NOT NULL DEFAULT 'text',
	`content` text,
	`mediaUrl` text,
	`thumbnailUrl` text,
	`hashtags` json,
	`mentions` json,
	`visibility` enum('public','followers','private','community') NOT NULL DEFAULT 'public',
	`communityId` int,
	`parentId` int,
	`isRepost` boolean NOT NULL DEFAULT false,
	`isQuote` boolean NOT NULL DEFAULT false,
	`isPinned` boolean NOT NULL DEFAULT false,
	`likeCount` int NOT NULL DEFAULT 0,
	`commentCount` int NOT NULL DEFAULT 0,
	`repostCount` int NOT NULL DEFAULT 0,
	`viewCount` int NOT NULL DEFAULT 0,
	`shareCount` int NOT NULL DEFAULT 0,
	`aiScore` decimal(5,2) DEFAULT '0',
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quest_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questId` int NOT NULL,
	`progress` int NOT NULL DEFAULT 0,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quest_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`type` enum('daily','weekly','achievement','seasonal','special') NOT NULL,
	`xpReward` int NOT NULL DEFAULT 0,
	`tokenReward` decimal(18,4) DEFAULT '0',
	`requirements` json,
	`maxCompletions` int NOT NULL DEFAULT 1,
	`isActive` boolean NOT NULL DEFAULT true,
	`seasonId` int,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`reviewerId` int NOT NULL,
	`sellerId` int NOT NULL,
	`rating` int NOT NULL,
	`content` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `seasons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`number` int NOT NULL,
	`status` enum('upcoming','active','completed') NOT NULL DEFAULT 'upcoming',
	`xpMultiplier` decimal(3,1) DEFAULT '1.0',
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `seasons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staking_positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(20) NOT NULL DEFAULT 'SKY444',
	`amount` decimal(24,8) NOT NULL,
	`apy` decimal(5,2) NOT NULL,
	`lockDays` int NOT NULL,
	`rewardsEarned` decimal(24,8) NOT NULL DEFAULT '0',
	`status` enum('active','completed','withdrawn') NOT NULL DEFAULT 'active',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`unlocksAt` timestamp NOT NULL,
	CONSTRAINT `staking_positions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stream_chat` (
	`id` int AUTO_INCREMENT NOT NULL,
	`streamId` int NOT NULL,
	`userId` int NOT NULL,
	`message` text NOT NULL,
	`type` enum('chat','donation','subscription','raid','system') NOT NULL DEFAULT 'chat',
	`amount` decimal(18,4),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stream_chat_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stream_donations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`streamId` int NOT NULL,
	`donorId` int NOT NULL,
	`streamerId` int NOT NULL,
	`amount` decimal(18,4) NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'SKY444',
	`message` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stream_donations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stream_memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`streamerId` int NOT NULL,
	`userId` int NOT NULL,
	`tier` enum('basic','premium','vip') NOT NULL DEFAULT 'basic',
	`price` decimal(10,2) NOT NULL,
	`isGifted` boolean NOT NULL DEFAULT false,
	`giftedBy` int,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stream_memberships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `streams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`streamerId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`thumbnailUrl` text,
	`status` enum('scheduled','live','ended','archived') NOT NULL DEFAULT 'scheduled',
	`category` varchar(50),
	`viewerCount` int NOT NULL DEFAULT 0,
	`peakViewers` int NOT NULL DEFAULT 0,
	`totalViews` int NOT NULL DEFAULT 0,
	`duration` int DEFAULT 0,
	`isCoStream` boolean NOT NULL DEFAULT false,
	`isPremium` boolean NOT NULL DEFAULT false,
	`archiveUrl` text,
	`scheduledAt` timestamp,
	`startedAt` timestamp,
	`endedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `streams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`receiverId` int NOT NULL,
	`amount` decimal(18,4) NOT NULL,
	`currency` varchar(20) NOT NULL DEFAULT 'SKY444',
	`message` text,
	`postId` int,
	`streamId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tips_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `token_balances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(20) NOT NULL,
	`balance` decimal(24,8) NOT NULL DEFAULT '0',
	`stakedBalance` decimal(24,8) NOT NULL DEFAULT '0',
	`pendingRewards` decimal(24,8) NOT NULL DEFAULT '0',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `token_balances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tournament_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournamentId` int NOT NULL,
	`userId` int NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`rank` int,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tournament_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tournaments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`type` enum('pvp','guild_war','community','stream_battle','charity') NOT NULL,
	`status` enum('upcoming','active','completed','cancelled') NOT NULL DEFAULT 'upcoming',
	`prizePool` decimal(18,4) DEFAULT '0',
	`prizeToken` varchar(20) DEFAULT 'SKY444',
	`maxParticipants` int,
	`participantCount` int NOT NULL DEFAULT 0,
	`winnerId` int,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tournaments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('transfer','stake','unstake','reward','donation','purchase','swap','tip','payout') NOT NULL,
	`token` varchar(20) NOT NULL,
	`amount` decimal(24,8) NOT NULL,
	`fromAddress` varchar(128),
	`toAddress` varchar(128),
	`txHash` varchar(128),
	`status` enum('pending','confirmed','failed') NOT NULL DEFAULT 'pending',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`achievementId` int NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin','creator','moderator') NOT NULL DEFAULT 'user',
	`verified` boolean NOT NULL DEFAULT false,
	`avatar` text,
	`banner` text,
	`bio` text,
	`displayName` varchar(100),
	`username` varchar(50),
	`xp` int NOT NULL DEFAULT 0,
	`level` int NOT NULL DEFAULT 1,
	`reputation` int NOT NULL DEFAULT 0,
	`walletAddress` varchar(128),
	`isCreator` boolean NOT NULL DEFAULT false,
	`isStreamer` boolean NOT NULL DEFAULT false,
	`followerCount` int NOT NULL DEFAULT 0,
	`followingCount` int NOT NULL DEFAULT 0,
	`postCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`address` varchar(128) NOT NULL,
	`chain` varchar(20) NOT NULL DEFAULT 'ethereum',
	`isPrimary` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wallets_id` PRIMARY KEY(`id`)
);
