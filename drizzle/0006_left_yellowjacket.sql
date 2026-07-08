CREATE TABLE `ageVerifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`method` varchar(50) NOT NULL DEFAULT 'self_declaration',
	`verifiedAt` timestamp NOT NULL DEFAULT (now()),
	`ipAddress` varchar(64),
	`userAgent` text,
	`consentGiven` boolean NOT NULL DEFAULT true,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `ageVerifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creatorPayouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` varchar(255) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`method` varchar(50) NOT NULL DEFAULT 'stripe',
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`stripeTransferId` varchar(255),
	`notes` text,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	CONSTRAINT `creatorPayouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creatorProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`displayName` varchar(100) NOT NULL,
	`bio` text,
	`avatarUrl` text,
	`bannerUrl` text,
	`isNsfwEnabled` boolean NOT NULL DEFAULT false,
	`isVerified` boolean NOT NULL DEFAULT false,
	`subscriptionPrice` decimal(10,2) DEFAULT '9.99',
	`subscriptionPriceMonthly` decimal(10,2) DEFAULT '9.99',
	`subscriptionPrice3Month` decimal(10,2) DEFAULT '24.99',
	`subscriptionPriceYearly` decimal(10,2) DEFAULT '79.99',
	`totalEarnings` decimal(14,2) DEFAULT '0',
	`totalSubscribers` int NOT NULL DEFAULT 0,
	`totalPosts` int NOT NULL DEFAULT 0,
	`totalLikes` int NOT NULL DEFAULT 0,
	`stripeConnectId` varchar(255),
	`payoutEmail` varchar(255),
	`platformFeePercent` decimal(5,2) DEFAULT '20',
	`welcomeMessage` text,
	`tags` text,
	`socialLinks` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creatorProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `creatorProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `dhgateOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255),
	`productId` varchar(50) NOT NULL,
	`productTitle` varchar(255) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`selectedColor` varchar(100),
	`selectedSize` varchar(50),
	`baseAmount` decimal(10,2) NOT NULL,
	`platformFee` decimal(10,2) NOT NULL,
	`shippingFee` decimal(10,2) NOT NULL DEFAULT '0.00',
	`totalAmount` decimal(10,2) NOT NULL,
	`adminEarnings` decimal(10,2) NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`dhgateOrderRef` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dhgateOrders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dhgateProducts` (
	`id` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`brand` varchar(100) NOT NULL,
	`category` varchar(50) NOT NULL,
	`basePrice` decimal(10,2) NOT NULL,
	`platformPrice` decimal(10,2) NOT NULL,
	`adminFeePercent` int NOT NULL DEFAULT 44,
	`adminFeeAmount` decimal(10,2) NOT NULL,
	`imageUrl` text NOT NULL,
	`rating` decimal(3,1) NOT NULL DEFAULT '4.5',
	`reviewCount` int NOT NULL DEFAULT 0,
	`soldCount` int NOT NULL DEFAULT 0,
	`deliveryDays` varchar(50) NOT NULL DEFAULT '14-21 days',
	`tags` text NOT NULL DEFAULT ('[]'),
	`colors` text NOT NULL DEFAULT ('[]'),
	`sizes` text NOT NULL DEFAULT ('[]'),
	`description` text NOT NULL,
	`discountPercent` int,
	`isHot` boolean NOT NULL DEFAULT false,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`dhgateSearchQuery` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dhgateProducts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dhgateReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` varchar(50) NOT NULL,
	`reviewerName` varchar(100) NOT NULL,
	`reviewerCountry` varchar(10) NOT NULL DEFAULT '🇺🇸',
	`rating` int NOT NULL DEFAULT 5,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`reviewDate` varchar(50) NOT NULL,
	`helpfulCount` int NOT NULL DEFAULT 0,
	`isVerified` boolean NOT NULL DEFAULT true,
	`imageUrls` text NOT NULL DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dhgateReviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dmMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` varchar(255) NOT NULL,
	`receiverId` varchar(255) NOT NULL,
	`content` text,
	`mediaUrl` text,
	`mediaType` varchar(50),
	`isPaid` boolean NOT NULL DEFAULT false,
	`paidAmount` decimal(10,2),
	`isUnlocked` boolean NOT NULL DEFAULT false,
	`isRead` boolean NOT NULL DEFAULT false,
	`isDeleted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dmMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nsfwContent` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`contentType` varchar(50) NOT NULL,
	`mediaUrls` text NOT NULL,
	`thumbnailUrl` text,
	`previewUrl` text,
	`accessType` varchar(50) NOT NULL DEFAULT 'subscription',
	`ppvPrice` decimal(10,2),
	`tipUnlockAmount` decimal(10,2),
	`isNsfw` boolean NOT NULL DEFAULT true,
	`isPublished` boolean NOT NULL DEFAULT false,
	`isScheduled` boolean DEFAULT false,
	`scheduledAt` timestamp,
	`viewCount` int NOT NULL DEFAULT 0,
	`likeCount` int NOT NULL DEFAULT 0,
	`purchaseCount` int NOT NULL DEFAULT 0,
	`tags` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `nsfwContent_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nsfwPurchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`buyerId` varchar(255) NOT NULL,
	`creatorId` varchar(255) NOT NULL,
	`contentId` int NOT NULL,
	`purchaseType` varchar(50) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`platformFee` decimal(10,2) NOT NULL,
	`creatorEarnings` decimal(10,2) NOT NULL,
	`paymentMethod` varchar(50) DEFAULT 'stripe',
	`stripePaymentIntentId` varchar(255),
	`status` varchar(50) NOT NULL DEFAULT 'completed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `nsfwPurchases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nsfwSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriberId` varchar(255) NOT NULL,
	`creatorId` varchar(255) NOT NULL,
	`tier` varchar(50) NOT NULL DEFAULT 'monthly',
	`priceAtSubscription` decimal(10,2) NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'active',
	`stripeSubscriptionId` varchar(255),
	`currentPeriodStart` timestamp NOT NULL DEFAULT (now()),
	`currentPeriodEnd` timestamp NOT NULL,
	`cancelledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `nsfwSubscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nsfwTips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` varchar(255) NOT NULL,
	`creatorId` varchar(255) NOT NULL,
	`contentId` int,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(20) NOT NULL DEFAULT 'USD',
	`message` text,
	`isAnonymous` boolean NOT NULL DEFAULT false,
	`unlocksContent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `nsfwTips_id` PRIMARY KEY(`id`)
);
