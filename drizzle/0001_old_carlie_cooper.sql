CREATE TABLE `ad_revenue_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int NOT NULL,
	`period` varchar(7) NOT NULL,
	`impressions` int NOT NULL DEFAULT 0,
	`revenue` decimal(18,8) DEFAULT '0',
	`paidOut` boolean NOT NULL DEFAULT false,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ad_revenue_shares_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audio_rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hostId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`topic` varchar(100),
	`status` enum('scheduled','live','ended') NOT NULL DEFAULT 'scheduled',
	`listenerCount` int NOT NULL DEFAULT 0,
	`speakerIds` json,
	`scheduledAt` timestamp,
	`startedAt` timestamp,
	`endedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audio_rooms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bookmarks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`postId` int NOT NULL,
	`collectionName` varchar(100) DEFAULT 'Saved',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bookmarks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `broadcast_channels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`avatar` text,
	`subscriberCount` int NOT NULL DEFAULT 0,
	`isVerified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `broadcast_channels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `broadcast_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channelId` int NOT NULL,
	`content` text NOT NULL,
	`mediaUrl` text,
	`reactionCount` int NOT NULL DEFAULT 0,
	`viewCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `broadcast_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `broadcast_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channelId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `broadcast_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporterId` int NOT NULL,
	`postId` int,
	`commentId` int,
	`targetUserId` int,
	`reason` enum('spam','harassment','hate_speech','misinformation','copyright','violence','other') NOT NULL,
	`details` text,
	`status` enum('pending','reviewed','actioned','dismissed') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creator_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`profileViews` int NOT NULL DEFAULT 0,
	`postImpressions` int NOT NULL DEFAULT 0,
	`newFollowers` int NOT NULL DEFAULT 0,
	`engagementRate` decimal(5,2) DEFAULT '0',
	`reachCount` int NOT NULL DEFAULT 0,
	`watchTimeMinutes` int NOT NULL DEFAULT 0,
	`revenueEarned` decimal(18,8) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creator_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `direct_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`recipientId` int NOT NULL,
	`content` text,
	`mediaUrl` text,
	`mediaType` enum('image','video','audio','file'),
	`isDisappearing` boolean NOT NULL DEFAULT false,
	`disappearsAt` timestamp,
	`readAt` timestamp,
	`deletedBySender` boolean NOT NULL DEFAULT false,
	`deletedByRecipient` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `direct_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dm_group_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`senderId` int NOT NULL,
	`content` text,
	`mediaUrl` text,
	`replyToId` int,
	`reactions` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dm_group_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dm_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100),
	`avatar` text,
	`creatorId` int NOT NULL,
	`memberIds` json NOT NULL,
	`adminIds` json NOT NULL,
	`lastMessageAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dm_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_rsvps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('going','maybe','not_going') NOT NULL DEFAULT 'going',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `event_rsvps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hostId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`coverImage` text,
	`location` varchar(300),
	`isOnline` boolean NOT NULL DEFAULT false,
	`streamUrl` text,
	`visibility` enum('public','private','followers') NOT NULL DEFAULT 'public',
	`maxAttendees` int,
	`rsvpCount` int NOT NULL DEFAULT 0,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `poll_votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pollId` int NOT NULL,
	`userId` int NOT NULL,
	`optionIndex` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `poll_votes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `polls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`question` text NOT NULL,
	`options` json NOT NULL,
	`endsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `polls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_drafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`content` text,
	`mediaUrl` text,
	`hashtags` json,
	`scheduledAt` timestamp,
	`isScheduled` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `post_drafts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`postId` int,
	`commentId` int,
	`messageId` int,
	`emoji` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `storefront_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storefrontId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`imageUrl` text,
	`price` decimal(18,8) NOT NULL,
	`currency` varchar(10) DEFAULT 'SKY444',
	`stock` int DEFAULT -1,
	`soldCount` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `storefront_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `storefronts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`banner` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`totalSales` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `storefronts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `story_highlights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(50) NOT NULL,
	`coverImage` text,
	`storyIds` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `story_highlights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_blocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`blockerId` int NOT NULL,
	`blockedId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_blocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_mutes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`muterId` int NOT NULL,
	`mutedId` int,
	`mutedKeyword` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_mutes_id` PRIMARY KEY(`id`)
);
