"""Protocol constants shared with the TypeScript core, so no code hardcodes the
wire strings."""

from enum import Enum

JSONRPC_VERSION = "2.0"
WIRE_VERSION = "1.0"


class HandshakeType(str, Enum):
    CHALLENGE = "challenge"
    HELLO = "hello"


class RpcMethod(str, Enum):
    SETTINGS_DESCRIBE = "settings.describe"
    GUILD_CHANNELS = "guild.channels"
    GUILD_ROLES = "guild.roles"
    GUILD_MEMBER_PERMISSIONS = "guild.member.permissions"
    SETTING_GET = "setting.get"
    SETTING_SET = "setting.set"
    ACTION_INVOKE = "action.invoke"


class ProtocolEvent(str, Enum):
    SETTING_CHANGED = "setting.changed"
    GUILD_UPDATED = "guild.updated"
    STATS_PUSH = "stats.push"
    MODULE_EVENT = "module.event"
