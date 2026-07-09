# @discord-dashboard/core

The engine that binds the protocol, schema and entitlements together.

- BotAdapter: the boundary between the dashboard and a bot. In process for lite
  mode, remote (over the gateway) for platform mode.
- SettingsService: reads and writes through the adapter, applies defaults, gates
  on entitlements and validates against the schema. Accepts a static schema or a
  provider for bots whose schema can change.
- buildDefFromAdapter: reconstruct a validating schema from a connected bot.
- EventSourcedStore: an audit trail with history and rollback.
- Entitlements: one question, many billing sources.
