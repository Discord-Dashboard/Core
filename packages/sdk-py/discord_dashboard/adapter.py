"""Bot adapter that connects out to the dashboard gateway over WebSocket."""

import asyncio
import hashlib
import hmac
import inspect
import json

import websockets

from .fields import PROTOCOL_VERSION, to_wire
from .protocol import JSONRPC_VERSION, WIRE_VERSION, HandshakeType, RpcMethod

# The JSON-RPC code for a failed handler, the protocol's InternalError.
INTERNAL_ERROR = -32603


class Adapter:
    def __init__(self, bot_id: str, secret: str, gateway: str, reconnect_ms: int = 1000):
        self.bot_id = bot_id
        self.secret = secret
        self.gateway = gateway
        self.reconnect_ms = reconnect_ms
        self._schema = None
        self._getter = None
        self._setter = None
        self._action = None
        self._resources = None
        self._permissions = None
        self._ws = None
        self._closed = False

    def settings(self, schema):
        self._schema = schema
        return self

    def on_get(self, fn):
        self._getter = fn
        return self

    def on_set(self, fn):
        self._setter = fn
        return self

    def on_action(self, fn):
        self._action = fn
        return self

    def on_resources(self, fn):
        """Lists what a picker offers, such as a space's channels or roles:
        fn(space_id, kind) returns [{"label": ..., "value": ...}]. A handler
        that declares filter or platform gets those too."""
        self._resources = fn
        return self

    def on_permissions(self, fn):
        """A member's permissions in a space: fn(space_id, user_id) returns a
        list such as ["MANAGE_GUILD"]."""
        self._permissions = fn
        return self

    async def push(self, method, params=None):
        if self._ws is not None:
            await self._ws.send(
                json.dumps({"jsonrpc": JSONRPC_VERSION, "method": method, "params": params})
            )

    def disconnect(self):
        self._closed = True

    def run(self):
        """Connects and blocks until disconnect(). Use start() inside a
        program that already runs an asyncio loop, such as a discord.py bot."""
        asyncio.run(self.start())

    # Reconnect automatically so the bot survives a dashboard restart.
    async def start(self):
        """Connects and keeps reconnecting until disconnect(), for example as
        asyncio.create_task(adapter.start())."""
        while not self._closed:
            try:
                await self._loop()
            except Exception:
                pass
            if self._closed or self.reconnect_ms <= 0:
                break
            await asyncio.sleep(self.reconnect_ms / 1000)

    async def _loop(self):
        async with websockets.connect(self.gateway) as ws:
            self._ws = ws
            async for raw in ws:
                try:
                    frame = json.loads(raw)
                except ValueError:
                    continue
                # A frame must be a JSON object; null, lists and numbers are not.
                if isinstance(frame, dict):
                    await self._handle(ws, frame)

    async def _handle(self, ws, frame):
        if frame.get("type") == HandshakeType.CHALLENGE:
            nonce = frame["nonce"]
            sig = hmac.new(
                self.secret.encode(), nonce.encode(), hashlib.sha256
            ).hexdigest()
            await ws.send(
                json.dumps(
                    {
                        "jsonrpc": JSONRPC_VERSION,
                        "id": HandshakeType.HELLO.value,
                        "method": HandshakeType.HELLO.value,
                        "params": {
                            "protocolVersion": PROTOCOL_VERSION,
                            "botId": self.bot_id,
                            "nonceSig": sig,
                            "capabilities": [],
                        },
                    }
                )
            )
            return

        method = frame.get("method")
        if method and "id" in frame:
            params = frame.get("params")
            try:
                result = await self._dispatch(method, params if isinstance(params, dict) else {})
            except Exception as err:
                # A handler failed. Answer with a JSON-RPC error so the dashboard
                # call fails at once, and keep the connection open for the next one.
                await ws.send(
                    json.dumps(
                        {
                            "jsonrpc": JSONRPC_VERSION,
                            "id": frame["id"],
                            "error": {"code": INTERNAL_ERROR, "message": str(err) or "handler failed"},
                        }
                    )
                )
                return
            await ws.send(
                json.dumps({"jsonrpc": JSONRPC_VERSION, "id": frame["id"], "result": result})
            )

    async def _dispatch(self, method, params):
        space_id = params.get("spaceId")
        # Passed only to handlers that take them, so two argument lambdas work.
        extra = {"platform": params.get("platform"), "actor": params.get("actor")}
        if method == RpcMethod.SETTINGS_DESCRIBE:
            return to_wire(self._schema) if self._schema else {"version": WIRE_VERSION, "categories": []}
        if method == RpcMethod.SETTING_GET:
            value = None
            if self._getter:
                value = await _call(self._getter, (space_id, params.get("key")), extra)
            return {"value": value}
        if method == RpcMethod.SETTING_SET:
            if self._setter:
                await _call(
                    self._setter, (space_id, params.get("key"), params.get("value")), extra
                )
            return {"ok": True}
        # Without a handler, an empty list: a picker shows nothing rather than
        # failing on a malformed answer.
        if method == RpcMethod.SPACE_RESOURCES:
            items = None
            if self._resources:
                items = await _call(
                    self._resources,
                    (space_id, params.get("kind")),
                    {"filter": params.get("filter"), "platform": params.get("platform")},
                )
            return items or []
        if method == RpcMethod.SPACE_MEMBER_PERMISSIONS:
            permissions = None
            if self._permissions:
                permissions = await _call(
                    self._permissions,
                    (space_id, params.get("userId")),
                    {"platform": params.get("platform")},
                )
            return {"permissions": permissions or []}
        if method == RpcMethod.ACTION_INVOKE:
            if self._action:
                return await _call(
                    self._action,
                    (space_id, params.get("name"), params.get("payload")),
                    {"platform": params.get("platform")},
                )
            return None
        return {}


async def _call(fn, args, extra):
    """Calls a handler with the keyword args it declares (or all, for **kwargs),
    and awaits it when it is a coroutine."""
    try:
        params = inspect.signature(fn).parameters.values()
    except (TypeError, ValueError):
        params = []
    takes_all = any(p.kind is inspect.Parameter.VAR_KEYWORD for p in params)
    names = {p.name for p in params}
    kwargs = {k: v for k, v in extra.items() if takes_all or k in names}
    result = fn(*args, **kwargs)
    if asyncio.iscoroutine(result):
        result = await result
    return result
