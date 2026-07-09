# @discord-dashboard/protocol

The bot adapter protocol. This package is the source of truth for the wire
types shared by the dashboard and every SDK.

The bot connects out to the gateway over WebSocket and proves identity by
signing the server nonce (HMAC-SHA256). Frames are JSON-RPC 2.0.

Methods the dashboard calls on the bot:

- settings.describe, setting.get, setting.set
- guild.channels, guild.roles, guild.member.permissions
- action.invoke

Notifications the bot pushes:

- setting.changed, guild.updated, stats.push, module.event

The current major version is negotiated during the handshake; incompatible
majors are rejected.
