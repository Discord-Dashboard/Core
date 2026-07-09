import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from discord_dashboard import Adapter


def test_reconnects_until_closed():
    adapter = Adapter(bot_id="b", secret="s", gateway="ws://x", reconnect_ms=1)
    calls = {"n": 0}

    async def fake_loop():
        calls["n"] += 1
        if calls["n"] >= 3:
            adapter._closed = True
        raise ConnectionError("drop")

    adapter._loop = fake_loop
    asyncio.run(adapter._run_forever())
    assert calls["n"] == 3


def test_stops_when_reconnect_disabled():
    adapter = Adapter(bot_id="b", secret="s", gateway="ws://x", reconnect_ms=0)
    calls = {"n": 0}

    async def fake_loop():
        calls["n"] += 1
        raise ConnectionError("drop")

    adapter._loop = fake_loop
    asyncio.run(adapter._run_forever())
    assert calls["n"] == 1
