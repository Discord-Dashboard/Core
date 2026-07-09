import { sql } from "drizzle-orm"
import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

// Every domain table carries tenantId. In lite mode there is a single tenant.
const now = sql`(strftime('%s','now'))`

export const tenants = sqliteTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: integer("created_at").default(now),
})

export const bots = sqliteTable("bots", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  name: text("name").notNull(),
  // Encrypted, not hashed: the gateway needs the plaintext secret to verify the
  // HMAC handshake, so it must be reversible (encrypted at rest).
  sharedSecretEnc: text("shared_secret_enc").notNull(),
  createdAt: integer("created_at").default(now),
})

export const guildSettings = sqliteTable(
  "guild_settings",
  {
    botId: text("bot_id").notNull(),
    guildId: text("guild_id").notNull(),
    key: text("key").notNull(),
    valueJson: text("value_json"),
    updatedBy: text("updated_by"),
    updatedAt: integer("updated_at").default(now),
  },
  // One row per setting: the natural key is (bot, guild, key). This is the
  // conflict target for upserts and stops duplicate rows for the same setting.
  (t) => [primaryKey({ columns: [t.botId, t.guildId, t.key] })]
)

export const pages = sqliteTable(
  "pages",
  {
    id: text("id").primaryKey(),
    botId: text("bot_id").notNull(),
    slug: text("slug").notNull(),
    puckJson: text("puck_json").notNull(),
    version: integer("version").notNull().default(1),
    status: text("status").notNull().default("draft"),
  },
  // A slug identifies a page within a bot, so it must be unique per bot.
  (t) => [uniqueIndex("pages_bot_slug").on(t.botId, t.slug)]
)

export const themes = sqliteTable("themes", {
  id: text("id").primaryKey(),
  botId: text("bot_id").notNull(),
  tokensJson: text("tokens_json").notNull(),
})

export const modules = sqliteTable("modules", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  version: text("version").notNull(),
  manifestJson: text("manifest_json").notNull(),
  sandboxPolicy: text("sandbox_policy"),
})

export const entitlements = sqliteTable("entitlements", {
  id: text("id").primaryKey(),
  subjectType: text("subject_type").notNull(),
  subjectId: text("subject_id").notNull(),
  feature: text("feature").notNull(),
  source: text("source").notNull(),
  status: text("status").notNull().default("active"),
  expiresAt: integer("expires_at"),
})

export const stripeAccounts = sqliteTable("stripe_accounts", {
  botId: text("bot_id").primaryKey(),
  connectAccountId: text("connect_account_id").notNull(),
  chargesEnabled: integer("charges_enabled", { mode: "boolean" }).default(false),
})

export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  source: text("source").notNull(),
  externalId: text("external_id").notNull(),
  subject: text("subject").notNull(),
  plan: text("plan").notNull(),
  status: text("status").notNull(),
})

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  dataJson: text("data_json").notNull(),
  expiresAt: integer("expires_at").notNull(),
})

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  actor: text("actor"),
  action: text("action").notNull(),
  targetJson: text("target_json"),
  createdAt: integer("created_at").default(now),
})
