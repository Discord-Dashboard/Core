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
- space.resources `{ spaceId, kind, filter? }`
- space.member.permissions `{ spaceId, userId }`
- setting.get `{ spaceId, key, actor? }`
- setting.set `{ spaceId, key, value, actor? }`
- action.invoke `{ spaceId, name, payload? }`

A space is the platform's unit a dashboard manages, such as a Discord guild.
`space.resources` lists one kind of thing in it for a picker (`channel` and
`role` on Discord), and returns `{ label, value }` items.

The space id is always supplied by the server from the authorized request, so a
bot must act on that space and never trust a space id found inside a payload.
The optional `actor` carries the acting user (`{ userId }`) so a bot can record
who changed a setting.

## Notifications (bot to dashboard)

- setting.changed `{ spaceId, key, value }`
- space.updated `{ spaceId }`
- stats.push
- module.event

## Versions

The current version is 2.0.0. The gateway closes the connection with 4400 when
a bot's major version differs. Version 1 used `guild.channels`, `guild.roles`,
`guild.member.permissions`, `guild.updated` and `guildId` params; a 1.x bot has
to update its SDK.

A bot in any language that speaks this protocol works with the dashboard.
