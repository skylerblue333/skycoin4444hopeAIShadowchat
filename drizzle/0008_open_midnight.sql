ALTER TABLE `on_chain_transactions` MODIFY COLUMN `amount` decimal(38,18) NOT NULL;--> statement-breakpoint
ALTER TABLE `on_chain_transactions` MODIFY COLUMN `gas_used` decimal(38,18);--> statement-breakpoint
ALTER TABLE `on_chain_transactions` MODIFY COLUMN `gas_price` decimal(38,18);--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `total` decimal(38,18);--> statement-breakpoint
ALTER TABLE `platform_metrics` MODIFY COLUMN `value` decimal(38,18) NOT NULL;--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `price` decimal(38,18);--> statement-breakpoint
ALTER TABLE `sprint_metrics` MODIFY COLUMN `metric_value` decimal NOT NULL;--> statement-breakpoint
ALTER TABLE `token_balances` MODIFY COLUMN `balance` decimal(38,18);--> statement-breakpoint
ALTER TABLE `token_balances` MODIFY COLUMN `locked_balance` decimal(38,18);--> statement-breakpoint
ALTER TABLE `token_balances` MODIFY COLUMN `staked_balance` decimal(38,18);--> statement-breakpoint
ALTER TABLE `token_emission_caps` MODIFY COLUMN `daily_cap` decimal(38,18) NOT NULL;--> statement-breakpoint
ALTER TABLE `token_emission_caps` MODIFY COLUMN `current_day_emission` decimal(38,18);--> statement-breakpoint
ALTER TABLE `token_market_state` MODIFY COLUMN `price_usd` decimal(38,18) NOT NULL;--> statement-breakpoint
ALTER TABLE `token_market_state` MODIFY COLUMN `market_cap_usd` decimal(38,18) NOT NULL;--> statement-breakpoint
ALTER TABLE `token_market_state` MODIFY COLUMN `volume_24h_usd` decimal(38,18) NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` MODIFY COLUMN `amount` decimal(38,18);--> statement-breakpoint
ALTER TABLE `user_archetypes` MODIFY COLUMN `score` decimal;--> statement-breakpoint
ALTER TABLE `user_behavior_signals` MODIFY COLUMN `value` decimal(38,18);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `balance` decimal(38,18);--> statement-breakpoint
ALTER TABLE `wallet_transactions` MODIFY COLUMN `amount` decimal(38,18) NOT NULL;--> statement-breakpoint
ALTER TABLE `wallet_transactions` MODIFY COLUMN `fee` decimal(38,18);--> statement-breakpoint
ALTER TABLE `wallets` MODIFY COLUMN `balance` decimal(38,18);