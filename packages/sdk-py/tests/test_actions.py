import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from discord_dashboard import Adapter


def test_action_dispatch_returns_handler_result():
    adapter = Adapter(bot_id="b", secret="s", gateway="ws://x")
    adapter.on_action(lambda guild_id, name, payload: {"guild": guild_id, "ran": name, "echo": payload})
    result = asyncio.run(
        adapter._dispatch(
            "action.invoke",
            {"guildId": "g1", "name": "sendTest", "payload": {"channel": "c1"}},
        )
    )
    assert result == {"guild": "g1", "ran": "sendTest", "echo": {"channel": "c1"}}


def test_action_without_handler_returns_none():
    adapter = Adapter(bot_id="b", secret="s", gateway="ws://x")
    result = asyncio.run(adapter._dispatch("action.invoke", {"name": "x"}))
    assert result is None


def test_setting_set_dispatch():
    store = {}
    adapter = Adapter(bot_id="b", secret="s", gateway="ws://x")
    adapter.on_set(lambda g, k, v: store.__setitem__((g, k), v))
    asyncio.run(adapter._dispatch("setting.set", {"guildId": "g", "key": "prefix", "value": "!"}))
    assert store[("g", "prefix")] == "!"
