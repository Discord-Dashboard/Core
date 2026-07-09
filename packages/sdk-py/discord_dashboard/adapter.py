"""Bot adapter that connects out to the dashboard gateway over WebSocket."""

import asyncio
import hashlib
import hmac
import json

import websockets

from .fields import PROTOCOL_VERSION, to_wire
from .protocol import JSONRPC_VERSION, HandshakeType, RpcMethod


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

    async def push(self, method, params=None):
        if self._ws is not None:
            await self._ws.send(
                json.dumps({"jsonrpc": JSONRPC_VERSION, "method": method, "params": params})
            )

    def disconnect(self):
        self._closed = True

    def run(self):
        asyncio.run(self._run_forever())

    # Reconnect automatically so the bot survives a dashboard restart.
    async def _run_forever(self):
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
                await self._handle(ws, json.loads(raw))

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
            result = await self._dispatch(method, frame.get("params") or {})
            await ws.send(
                json.dumps({"jsonrpc": JSONRPC_VERSION, "id": frame["id"], "result": result})
            )

    async def _dispatch(self, method, params):
        if method == RpcMethod.SETTINGS_DESCRIBE:
            return to_wire(self._schema) if self._schema else {"version": "1.0", "categories": []}
        if method == RpcMethod.SETTING_GET:
            value = self._getter(params.get("guildId"), params.get("key")) if self._getter else None
            if asyncio.iscoroutine(value):
                value = await value
            return {"value": value}
        if method == RpcMethod.SETTING_SET:
            if self._setter:
                res = self._setter(params.get("guildId"), params.get("key"), params.get("value"))
                if asyncio.iscoroutine(res):
                    await res
            return {"ok": True}
        if method == RpcMethod.ACTION_INVOKE:
            if self._action:
                res = self._action(
                    params.get("guildId"), params.get("name"), params.get("payload")
                )
                if asyncio.iscoroutine(res):
                    res = await res
                return res
            return None
        return {}
