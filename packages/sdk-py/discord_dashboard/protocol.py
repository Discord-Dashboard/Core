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
    SPACE_RESOURCES = "space.resources"
    SPACE_MEMBER_PERMISSIONS = "space.member.permissions"
    SETTING_GET = "setting.get"
    SETTING_SET = "setting.set"
    ACTION_INVOKE = "action.invoke"


class ProtocolEvent(str, Enum):
    SETTING_CHANGED = "setting.changed"
    SPACE_UPDATED = "space.updated"
    STATS_PUSH = "stats.push"
    MODULE_EVENT = "module.event"
