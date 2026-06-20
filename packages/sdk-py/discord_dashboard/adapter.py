"""Bot adapter that connects out to the dashboard gateway over WebSocket."""

import asyncio
import hashlib
import hmac
import json

import websockets

from .fields import PROTOCOL_VERSION, to_wire


class Adapter:
    def __init__(self, bot_id: str, secret: str, gateway: str):
        self.bot_id = bot_id
        self.secret = secret
        self.gateway = gateway
        self._schema = None
        self._getter = None
        self._setter = None

    def settings(self, schema):
        self._schema = schema
        return self

    def on_get(self, fn):
        self._getter = fn
        return self

    def on_set(self, fn):
        self._setter = fn
        return self

    def run(self):
        asyncio.run(self._loop())

    async def _loop(self):
        async with websockets.connect(self.gateway) as ws:
            async for raw in ws:
                await self._handle(ws, json.loads(raw))

    async def _handle(self, ws, frame):
        if frame.get("type") == "challenge":
            nonce = frame["nonce"]
            sig = hmac.new(
                self.secret.encode(), nonce.encode(), hashlib.sha256
            ).hexdigest()
            await ws.send(
                json.dumps(
                    {
                        "jsonrpc": "2.0",
                        "id": "hello",
                        "method": "hello",
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
                json.dumps({"jsonrpc": "2.0", "id": frame["id"], "result": result})
            )

    async def _dispatch(self, method, params):
        if method == "settings.describe":
            return to_wire(self._schema) if self._schema else {"version": "1.0", "categories": []}
        if method == "setting.get":
            value = self._getter(params.get("guildId"), params.get("key")) if self._getter else None
            if asyncio.iscoroutine(value):
                value = await value
            return {"value": value}
        if method == "setting.set":
            if self._setter:
                res = self._setter(params.get("guildId"), params.get("key"), params.get("value"))
                if asyncio.iscoroutine(res):
                    await res
            return {"ok": True}
        return {}
