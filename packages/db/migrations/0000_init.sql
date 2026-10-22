CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`actor` text,
	`action` text NOT NULL,
	`target_json` text,
	`created_at` integer DEFAULT (strftime('%s','now'))
);
--> statement-breakpoint
CREATE TABLE `bots` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`shared_secret_enc` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now'))
);
--> statement-breakpoint
CREATE TABLE `entitlements` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_type` text NOT NULL,
	`subject_id` text NOT NULL,
	`feature` text NOT NULL,
	`source` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`expires_at` integer
);
--> statement-breakpoint
CREATE TABLE `modules` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`version` text NOT NULL,
	`manifest_json` text NOT NULL,
	`sandbox_policy` text
);
--> statement-breakpoint
CREATE TABLE `pages` (
	`id` text PRIMARY KEY NOT NULL,
	`bot_id` text NOT NULL,
	`slug` text NOT NULL,
	`puck_json` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pages_bot_slug` ON `pages` (`bot_id`,`slug`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`data_json` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `space_settings` (
	`bot_id` text NOT NULL,
	`platform` text NOT NULL,
	`space_id` text NOT NULL,
	`key` text NOT NULL,
	`value_json` text,
	`updated_by` text,
	`updated_at` integer DEFAULT (strftime('%s','now')),
	PRIMARY KEY(`bot_id`, `platform`, `space_id`, `key`)
);
--> statement-breakpoint
CREATE TABLE `stripe_accounts` (
	`bot_id` text PRIMARY KEY NOT NULL,
	`connect_account_id` text NOT NULL,
	`charges_enabled` integer DEFAULT false
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`external_id` text NOT NULL,
	`subject` text NOT NULL,
	`plan` text NOT NULL,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now'))
);
--> statement-breakpoint
CREATE TABLE `themes` (
	`id` text PRIMARY KEY NOT NULL,
	`bot_id` text NOT NULL,
	`tokens_json` text NOT NULL
);
