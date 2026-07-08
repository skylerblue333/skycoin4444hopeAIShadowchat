CREATE TABLE `audit_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`event_type` text NOT NULL,
	`action` text NOT NULL,
	`details` text,
	`ip_address` text,
	`user_agent` text,
	`status` text DEFAULT 'success',
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.159Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text,
	`user_id` text,
	`content` text,
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.158Z"',
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `custody_wallets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`external_id` text NOT NULL,
	`balance` real DEFAULT 0,
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.159Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `dating_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`blocked_user_id` text NOT NULL,
	`reason` text,
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.159Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`blocked_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `dating_likes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`liked_user_id` text NOT NULL,
	`type` text DEFAULT 'like',
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.159Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`liked_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `dating_matches` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id_1` text NOT NULL,
	`user_id_2` text NOT NULL,
	`status` text DEFAULT 'pending',
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.159Z"',
	FOREIGN KEY (`user_id_1`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id_2`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `dating_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`content` text NOT NULL,
	`read` integer DEFAULT false,
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.159Z"',
	FOREIGN KEY (`match_id`) REFERENCES `dating_matches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `dating_notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`related_user_id` text,
	`read` integer DEFAULT false,
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.159Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `dating_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`min_age` integer DEFAULT 18,
	`max_age` integer DEFAULT 65,
	`max_distance` integer DEFAULT 50,
	`gender_preference` text,
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.159Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `dating_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`bio` text,
	`photos` text,
	`interests` text,
	`location` text,
	`age` integer,
	`gender` text,
	`looking_for` text,
	`verified` integer DEFAULT false,
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.159Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `dating_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter_id` text NOT NULL,
	`reported_user_id` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'pending',
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.159Z"',
	FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reported_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `dating_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`tier` text DEFAULT 'free',
	`expires_at` integer,
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.159Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `follows` (
	`id` text PRIMARY KEY NOT NULL,
	`follower_id` text,
	`following_id` text,
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.158Z"',
	FOREIGN KEY (`follower_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`following_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `fraud_signals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`signal_type` text NOT NULL,
	`severity` text DEFAULT 'low',
	`details` text,
	`resolved` integer DEFAULT false,
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.159Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `governance_proposals` (
	`id` text PRIMARY KEY NOT NULL,
	`proposer_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'active',
	`votes_for` integer DEFAULT 0,
	`votes_against` integer DEFAULT 0,
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.159Z"',
	`expires_at` integer,
	FOREIGN KEY (`proposer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `governance_votes` (
	`id` text PRIMARY KEY NOT NULL,
	`proposal_id` text NOT NULL,
	`voter_id` text NOT NULL,
	`vote` text NOT NULL,
	`weight` real DEFAULT 1,
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.160Z"',
	FOREIGN KEY (`proposal_id`) REFERENCES `governance_proposals`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`voter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `likes` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text,
	`user_id` text,
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.158Z"',
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`sender_id` text,
	`recipient_id` text,
	`content` text,
	`read` integer DEFAULT false,
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.159Z"',
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `moderation_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`moderator_id` text,
	`target_user_id` text,
	`action` text NOT NULL,
	`reason` text,
	`duration` integer,
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.160Z"',
	FOREIGN KEY (`moderator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`type` text,
	`content` text,
	`read` integer DEFAULT false,
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.158Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `on_chain_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`blockchain` text NOT NULL,
	`tx_hash` text NOT NULL,
	`from_address` text,
	`to_address` text,
	`amount` real,
	`status` text DEFAULT 'pending',
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.159Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`product_id` text,
	`quantity` integer,
	`total` real,
	`status` text,
	`shipping_address` text,
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.158Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `platform_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`metric_type` text NOT NULL,
	`value` real NOT NULL,
	`timestamp` integer DEFAULT '"2026-07-03T13:02:42.160Z"'
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`content` text,
	`media` text,
	`likes` integer DEFAULT 0,
	`comments` integer DEFAULT 0,
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.157Z"',
	`updated_at` integer DEFAULT '"2026-07-03T13:02:42.157Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`description` text,
	`price` real,
	`category` text,
	`image` text,
	`stock` integer,
	`seller_id` text,
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.158Z"',
	FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rate_limit_buckets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`endpoint` text NOT NULL,
	`count` integer DEFAULT 0,
	`reset_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text,
	`user_id` text,
	`rating` integer,
	`comment` text,
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.159Z"',
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `streams` (
	`id` text PRIMARY KEY NOT NULL,
	`streamer_id` text,
	`title` text,
	`description` text,
	`status` text,
	`viewers` integer DEFAULT 0,
	`hls_url` text,
	`archive_url` text,
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.158Z"',
	FOREIGN KEY (`streamer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `token_balances` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_symbol` text NOT NULL,
	`balance` real DEFAULT 0,
	`locked_balance` real DEFAULT 0,
	`staked_balance` real DEFAULT 0,
	`updated_at` integer DEFAULT '"2026-07-03T13:02:42.159Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `token_emission_caps` (
	`id` text PRIMARY KEY NOT NULL,
	`token_symbol` text NOT NULL,
	`max_emission` real,
	`current_emission` real,
	`emission_rate` real,
	`last_adjusted_at` integer
);
--> statement-breakpoint
CREATE TABLE `token_market_state` (
	`id` text PRIMARY KEY NOT NULL,
	`token_symbol` text NOT NULL,
	`price` real NOT NULL,
	`market_cap` real,
	`volume_24h` real,
	`circulating_supply` real,
	`total_supply` real,
	`updated_at` integer DEFAULT '"2026-07-03T13:02:42.159Z"'
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`type` text,
	`amount` real,
	`to_user_id` text,
	`status` text,
	`tx_hash` text,
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.158Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_archetypes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`archetype` text NOT NULL,
	`score` real DEFAULT 0,
	`updated_at` integer DEFAULT '"2026-07-03T13:02:42.159Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_behavior_signals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`signal_type` text NOT NULL,
	`value` real DEFAULT 0,
	`metadata` text,
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.159Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`username` text,
	`name` text,
	`bio` text,
	`avatar` text,
	`balance` real DEFAULT 0,
	`role` text DEFAULT 'user',
	`verified` integer DEFAULT false,
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.156Z"',
	`updated_at` integer DEFAULT '"2026-07-03T13:02:42.156Z"'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `wallet_audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`wallet_id` text NOT NULL,
	`action` text NOT NULL,
	`details` text,
	`ip_address` text,
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.159Z"',
	FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `wallet_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`wallet_id` text NOT NULL,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`fee` real DEFAULT 0,
	`status` text DEFAULT 'pending',
	`tx_hash` text,
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.159Z"',
	FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`address` text,
	`balance` real DEFAULT 0,
	`currency` text,
	`created_at` integer DEFAULT '"2026-07-03T13:02:42.158Z"',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
