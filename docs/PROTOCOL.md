# Bot adapter protocol

The bot connects out to the gateway over WebSocket and proves identity by
signing a server nonce with its shared secret (HMAC-SHA256). Frames are
JSON-RPC 2.0. Either side can be the caller.

## Handshake

1. Server sends `{ type: "challenge", nonce, protocolVersion }`.
2. Bot replies `hello { protocolVersion, botId, nonceSig, capabilities }`.
3. Server verifies the signature and replies `ready { sessionId, heartbeatMs }`.

## Methods (dashboard to bot)

- settings.describe `{ locale? }`
- guild.channels `{ guildId, filter? }`
- guild.roles `{ guildId, filter? }`
- guild.member.permissions `{ guildId, userId }`
- setting.get `{ guildId, key, actor? }`
- setting.set `{ guildId, key, value, actor? }`
- action.invoke `{ guildId, name, payload? }`

The guild id is always supplied by the server from the authorized request, so a
bot must act on that guild and never trust a guild id found inside a payload.
The optional `actor` carries the acting user (`{ userId }`) so a bot can record
who changed a setting.

## Notifications (bot to dashboard)

- setting.changed
- guild.updated
- stats.push
- module.event

A bot in any language that speaks this protocol works with the dashboard.
