-- Dating System Tables

CREATE TABLE IF NOT EXISTS `dating_profiles` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL UNIQUE,
  `age` int,
  `gender` enum('male', 'female', 'non-binary', 'prefer_not_to_say'),
  `lookingFor` enum('male', 'female', 'non-binary', 'everyone'),
  `bio` text,
  `interests` json,
  `photos` json,
  `height` varchar(10),
  `bodyType` varchar(50),
  `ethnicity` varchar(50),
  `religion` varchar(50),
  `education` varchar(100),
  `occupation` varchar(100),
  `smoker` enum('yes', 'no', 'sometimes'),
  `drinker` enum('yes', 'no', 'sometimes'),
  `hasKids` boolean DEFAULT false,
  `wantsKids` enum('yes', 'no', 'maybe', 'unsure'),
  `relationshipGoal` enum('casual', 'serious', 'marriage', 'unsure'),
  `verificationStatus` enum('unverified', 'email_verified', 'phone_verified', 'id_verified') DEFAULT 'unverified',
  `profileCompleteness` int DEFAULT 0,
  `isActive` boolean DEFAULT true,
  `lastActiveAt` timestamp,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `dating_matches` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `user1Id` int NOT NULL,
  `user2Id` int NOT NULL,
  `matchType` enum('like', 'superlike', 'mutual_like', 'mutual_superlike') DEFAULT 'like',
  `compatibilityScore` decimal(5, 2) DEFAULT 0,
  `isMutual` boolean DEFAULT false,
  `lastMessageAt` timestamp,
  `isBlocked` boolean DEFAULT false,
  `blockedBy` int,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `match_pair` (`user1Id`, `user2Id`)
);

CREATE TABLE IF NOT EXISTS `dating_messages` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `matchId` int NOT NULL,
  `senderId` int NOT NULL,
  `recipientId` int NOT NULL,
  `content` text,
  `mediaUrl` text,
  `mediaType` enum('image', 'video', 'audio'),
  `readAt` timestamp,
  `deletedAt` timestamp,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`matchId`) REFERENCES `dating_matches`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `dating_notifications` (
  `id` varchar(100) PRIMARY KEY,
  `userId` int NOT NULL,
  `type` enum('match', 'message', 'superlike', 'like', 'profile_view', 'message_read') NOT NULL,
  `fromUserId` int NOT NULL,
  `matchId` int,
  `messageId` int,
  `title` varchar(200) NOT NULL,
  `content` text NOT NULL,
  `read` boolean DEFAULT false,
  `actionUrl` text,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  INDEX `user_notifications` (`userId`, `createdAt`)
);

CREATE TABLE IF NOT EXISTS `dating_preferences` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL UNIQUE,
  `minAge` int DEFAULT 18,
  `maxAge` int DEFAULT 65,
  `maxDistance` int DEFAULT 50,
  `lookingFor` json,
  `interests` json,
  `emailNotifications` boolean DEFAULT true,
  `pushNotifications` boolean DEFAULT true,
  `smsNotifications` boolean DEFAULT false,
  `matchNotifications` boolean DEFAULT true,
  `messageNotifications` boolean DEFAULT true,
  `superlikeNotifications` boolean DEFAULT true,
  `profileViewNotifications` boolean DEFAULT false,
  `soundEnabled` boolean DEFAULT true,
  `vibrationEnabled` boolean DEFAULT true,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `dating_subscriptions` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `tier` enum('free', 'premium', 'vip', 'elite') DEFAULT 'free',
  `status` enum('active', 'paused', 'cancelled', 'expired') DEFAULT 'active',
  `stripeSubscriptionId` varchar(100),
  `price` decimal(10, 2) DEFAULT 0,
  `currency` varchar(10) DEFAULT 'USD',
  `unlimitedLikes` boolean DEFAULT false,
  `unlimitedSuperLikes` boolean DEFAULT false,
  `unlimitedMessages` boolean DEFAULT false,
  `rewindFeature` boolean DEFAULT false,
  `boostFeature` boolean DEFAULT false,
  `incognitoMode` boolean DEFAULT false,
  `advancedFilters` boolean DEFAULT false,
  `seenByFeature` boolean DEFAULT false,
  `startsAt` timestamp,
  `endsAt` timestamp,
  `cancelledAt` timestamp,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `user_subscription` (`userId`)
);

CREATE TABLE IF NOT EXISTS `dating_likes` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `likedUserId` int NOT NULL,
  `type` enum('like', 'superlike', 'pass') DEFAULT 'like',
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `user_like` (`userId`, `likedUserId`)
);

CREATE TABLE IF NOT EXISTS `dating_blocks` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `blockedUserId` int NOT NULL,
  `reason` text,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `user_block` (`userId`, `blockedUserId`)
);

CREATE TABLE IF NOT EXISTS `dating_reports` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `reporterId` int NOT NULL,
  `reportedUserId` int NOT NULL,
  `reason` enum('inappropriate_photos', 'offensive_content', 'fake_profile', 'harassment', 'spam', 'other') NOT NULL,
  `description` text,
  `status` enum('pending', 'investigating', 'resolved', 'dismissed') DEFAULT 'pending',
  `resolvedAt` timestamp,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP
);
