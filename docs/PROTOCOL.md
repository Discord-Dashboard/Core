# Bot adapter protocol

The bot connects out to the gateway over WebSocket and proves identity by
signing a server nonce with its shared secret (HMAC-SHA256). Frames are
JSON-RPC 2.0. Either side can be the caller.

## Handshake

1. Server sends `{ type: "challenge", nonce, protocolVersion }`.
2. Bot replies `hello { protocolVersion, botId, nonceSig, capabilities }`.
3. Server verifies the signature and replies `ready { sessionId, heartbeatMs }`.

## Methods (dashboard to bot)

- settings.describe
- guild.channels
- guild.roles
- guild.member.permissions
- setting.get
- setting.set
- action.invoke

## Notifications (bot to dashboard)

- setting.changed
- guild.updated
- stats.push
- module.event

A bot in any language that speaks this protocol works with the dashboard.
