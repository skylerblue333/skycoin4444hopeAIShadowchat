CREATE TABLE `audit_ledger` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255),
	`event_type` varchar(255) NOT NULL,
	`action` varchar(255) NOT NULL,
	`details` varchar(255),
	`ip_address` varchar(255),
	`user_agent` varchar(255),
	`status` varchar(255) DEFAULT 'success',
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.415',
	CONSTRAINT `audit_ledger_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` varchar(255) NOT NULL,
	`post_id` varchar(255),
	`user_id` varchar(255),
	`content` varchar(255),
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.413',
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `custody_wallets` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`provider` varchar(255) NOT NULL,
	`external_id` varchar(255) NOT NULL,
	`balance` float DEFAULT 0,
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.415',
	CONSTRAINT `custody_wallets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dating_blocks` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`blocked_user_id` varchar(255) NOT NULL,
	`reason` varchar(255),
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.415',
	CONSTRAINT `dating_blocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dating_likes` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`liked_user_id` varchar(255) NOT NULL,
	`type` varchar(255) DEFAULT 'like',
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.415',
	CONSTRAINT `dating_likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dating_matches` (
	`id` varchar(255) NOT NULL,
	`user_id_1` text NOT NULL,
	`user_id_2` text NOT NULL,
	`status` varchar(255) DEFAULT 'pending',
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.415',
	CONSTRAINT `dating_matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dating_messages` (
	`id` varchar(255) NOT NULL,
	`match_id` varchar(255) NOT NULL,
	`sender_id` varchar(255) NOT NULL,
	`content` varchar(255) NOT NULL,
	`read` boolean DEFAULT false,
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.415',
	CONSTRAINT `dating_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dating_notifications` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`type` varchar(255) NOT NULL,
	`related_user_id` varchar(255),
	`read` boolean DEFAULT false,
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.415',
	CONSTRAINT `dating_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dating_preferences` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`min_age` int DEFAULT 18,
	`max_age` int DEFAULT 65,
	`max_distance` int DEFAULT 50,
	`gender_preference` varchar(255),
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.415',
	CONSTRAINT `dating_preferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dating_profiles` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`bio` varchar(255),
	`photos` varchar(255),
	`interests` varchar(255),
	`location` varchar(255),
	`age` int,
	`gender` varchar(255),
	`looking_for` varchar(255),
	`verified` boolean DEFAULT false,
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.415',
	CONSTRAINT `dating_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dating_reports` (
	`id` varchar(255) NOT NULL,
	`reporter_id` varchar(255) NOT NULL,
	`reported_user_id` varchar(255) NOT NULL,
	`reason` varchar(255) NOT NULL,
	`status` varchar(255) DEFAULT 'pending',
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.415',
	CONSTRAINT `dating_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dating_subscriptions` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`tier` varchar(255) DEFAULT 'free',
	`expires_at` timestamp,
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.415',
	CONSTRAINT `dating_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `follows` (
	`id` varchar(255) NOT NULL,
	`follower_id` varchar(255),
	`following_id` varchar(255),
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.414',
	CONSTRAINT `follows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fraud_signals` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255),
	`signal_type` varchar(255) NOT NULL,
	`severity` varchar(255) DEFAULT 'low',
	`details` varchar(255),
	`resolved` boolean DEFAULT false,
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.415',
	CONSTRAINT `fraud_signals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `governance_proposals` (
	`id` varchar(255) NOT NULL,
	`proposer_id` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` varchar(255),
	`status` varchar(255) DEFAULT 'active',
	`votes_for` int DEFAULT 0,
	`votes_against` int DEFAULT 0,
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.416',
	`expires_at` timestamp,
	CONSTRAINT `governance_proposals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `governance_votes` (
	`id` varchar(255) NOT NULL,
	`proposal_id` varchar(255) NOT NULL,
	`voter_id` varchar(255) NOT NULL,
	`vote` varchar(255) NOT NULL,
	`weight` float DEFAULT 1,
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.416',
	CONSTRAINT `governance_votes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `likes` (
	`id` varchar(255) NOT NULL,
	`post_id` varchar(255),
	`user_id` varchar(255),
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.413',
	CONSTRAINT `likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` varchar(255) NOT NULL,
	`sender_id` varchar(255),
	`recipient_id` varchar(255),
	`content` varchar(255),
	`read` boolean DEFAULT false,
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.414',
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `moderation_logs` (
	`id` varchar(255) NOT NULL,
	`moderator_id` varchar(255),
	`target_user_id` varchar(255),
	`action` varchar(255) NOT NULL,
	`reason` varchar(255),
	`duration` int,
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.416',
	CONSTRAINT `moderation_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255),
	`type` varchar(255),
	`content` varchar(255),
	`read` boolean DEFAULT false,
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.414',
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `on_chain_transactions` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`blockchain` varchar(255) NOT NULL,
	`tx_hash` varchar(255) NOT NULL,
	`from_address` varchar(255),
	`to_address` varchar(255),
	`amount` float,
	`status` varchar(255) DEFAULT 'pending',
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.415',
	CONSTRAINT `on_chain_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255),
	`product_id` varchar(255),
	`quantity` int,
	`total` float,
	`status` varchar(255),
	`shipping_address` varchar(255),
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.414',
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platform_metrics` (
	`id` varchar(255) NOT NULL,
	`metric_type` varchar(255) NOT NULL,
	`value` float NOT NULL,
	`timestamp` timestamp DEFAULT '2026-07-03 13:42:00.416',
	CONSTRAINT `platform_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255),
	`content` varchar(255),
	`media` varchar(255),
	`likes` int DEFAULT 0,
	`comments` int DEFAULT 0,
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.413',
	`updated_at` timestamp DEFAULT '2026-07-03 13:42:00.413',
	CONSTRAINT `posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255),
	`description` varchar(255),
	`price` float,
	`category` varchar(255),
	`image` varchar(255),
	`stock` int,
	`seller_id` varchar(255),
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.414',
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rate_limit_buckets` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255),
	`endpoint` varchar(255) NOT NULL,
	`count` int DEFAULT 0,
	`reset_at` timestamp,
	CONSTRAINT `rate_limit_buckets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` varchar(255) NOT NULL,
	`product_id` varchar(255),
	`user_id` varchar(255),
	`rating` int,
	`comment` varchar(255),
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.414',
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `streams` (
	`id` varchar(255) NOT NULL,
	`streamer_id` varchar(255),
	`title` varchar(255),
	`description` varchar(255),
	`status` varchar(255),
	`viewers` int DEFAULT 0,
	`hls_url` varchar(255),
	`archive_url` varchar(255),
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.414',
	CONSTRAINT `streams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `token_balances` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`token_symbol` varchar(255) NOT NULL,
	`balance` float DEFAULT 0,
	`locked_balance` float DEFAULT 0,
	`staked_balance` float DEFAULT 0,
	`updated_at` timestamp DEFAULT '2026-07-03 13:42:00.415',
	CONSTRAINT `token_balances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `token_emission_caps` (
	`id` varchar(255) NOT NULL,
	`token_symbol` varchar(255) NOT NULL,
	`max_emission` float,
	`current_emission` float,
	`emission_rate` float,
	`last_adjusted_at` timestamp,
	CONSTRAINT `token_emission_caps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `token_market_state` (
	`id` varchar(255) NOT NULL,
	`token_symbol` varchar(255) NOT NULL,
	`price` float NOT NULL,
	`market_cap` float,
	`volume_24h` float,
	`circulating_supply` float,
	`total_supply` float,
	`updated_at` timestamp DEFAULT '2026-07-03 13:42:00.416',
	CONSTRAINT `token_market_state_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255),
	`type` varchar(255),
	`amount` float,
	`to_user_id` varchar(255),
	`status` varchar(255),
	`tx_hash` varchar(255),
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.414',
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_archetypes` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`archetype` varchar(255) NOT NULL,
	`score` float DEFAULT 0,
	`updated_at` timestamp DEFAULT '2026-07-03 13:42:00.416',
	CONSTRAINT `user_archetypes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_behavior_signals` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`signal_type` varchar(255) NOT NULL,
	`value` float DEFAULT 0,
	`metadata` varchar(255),
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.415',
	CONSTRAINT `user_behavior_signals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(255) NOT NULL,
	`email` varchar(255),
	`username` varchar(255),
	`name` varchar(255),
	`bio` varchar(255),
	`avatar` varchar(255),
	`balance` float DEFAULT 0,
	`role` varchar(255) DEFAULT 'user',
	`verified` boolean DEFAULT false,
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.412',
	`updated_at` timestamp DEFAULT '2026-07-03 13:42:00.412',
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `wallet_audit_log` (
	`id` varchar(255) NOT NULL,
	`wallet_id` varchar(255) NOT NULL,
	`action` varchar(255) NOT NULL,
	`details` varchar(255),
	`ip_address` varchar(255),
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.415',
	CONSTRAINT `wallet_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallet_transactions` (
	`id` varchar(255) NOT NULL,
	`wallet_id` varchar(255) NOT NULL,
	`type` varchar(255) NOT NULL,
	`amount` float NOT NULL,
	`fee` float DEFAULT 0,
	`status` varchar(255) DEFAULT 'pending',
	`tx_hash` varchar(255),
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.415',
	CONSTRAINT `wallet_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255),
	`address` varchar(255),
	`balance` float DEFAULT 0,
	`currency` varchar(255),
	`created_at` timestamp DEFAULT '2026-07-03 13:42:00.414',
	CONSTRAINT `wallets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
