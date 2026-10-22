import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from discord_dashboard import Adapter


def test_action_dispatch_returns_handler_result():
    adapter = Adapter(bot_id="b", secret="s", gateway="ws://x")
    adapter.on_action(lambda space_id, name, payload: {"space": space_id, "ran": name, "echo": payload})
    result = asyncio.run(
        adapter._dispatch(
            "action.invoke",
            {"spaceId": "g1", "name": "sendTest", "payload": {"channel": "c1"}},
        )
    )
    assert result == {"space": "g1", "ran": "sendTest", "echo": {"channel": "c1"}}


def test_action_without_handler_returns_none():
    adapter = Adapter(bot_id="b", secret="s", gateway="ws://x")
    result = asyncio.run(adapter._dispatch("action.invoke", {"name": "x"}))
    assert result is None


def test_setting_set_dispatch():
    store = {}
    adapter = Adapter(bot_id="b", secret="s", gateway="ws://x")
    adapter.on_set(lambda g, k, v: store.__setitem__((g, k), v))
    asyncio.run(adapter._dispatch("setting.set", {"spaceId": "g", "key": "prefix", "value": "!"}))
    assert store[("g", "prefix")] == "!"


def test_handlers_that_ask_for_platform_and_actor_get_them():
    seen = {}
    adapter = Adapter(bot_id="b", secret="s", gateway="ws://x")

    async def getter(space_id, key, platform=None, actor=None):
        seen.update(space=space_id, key=key, platform=platform, actor=actor)
        return "!"

    adapter.on_get(getter)
    result = asyncio.run(
        adapter._dispatch(
            "setting.get",
            {"spaceId": "g", "key": "prefix", "platform": "discord", "actor": {"userId": "u1"}},
        )
    )
    assert result == {"value": "!"}
    assert seen == {"space": "g", "key": "prefix", "platform": "discord", "actor": {"userId": "u1"}}


def test_resources_dispatch_lists_picker_items():
    adapter = Adapter(bot_id="b", secret="s", gateway="ws://x")
    adapter.on_resources(lambda space_id, kind: [{"label": f"{space_id}-{kind}", "value": "1"}])
    result = asyncio.run(
        adapter._dispatch("space.resources", {"spaceId": "g", "kind": "channel", "filter": {"types": ["text"]}})
    )
    assert result == [{"label": "g-channel", "value": "1"}]


def test_resources_handler_can_ask_for_the_filter():
    seen = {}
    adapter = Adapter(bot_id="b", secret="s", gateway="ws://x")

    def resources(space_id, kind, filter=None):
        seen["filter"] = filter
        return []

    adapter.on_resources(resources)
    asyncio.run(adapter._dispatch("space.resources", {"spaceId": "g", "kind": "channel", "filter": {"types": ["text"]}}))
    assert seen["filter"] == {"types": ["text"]}


def test_lookups_without_handlers_answer_empty_lists():
    adapter = Adapter(bot_id="b", secret="s", gateway="ws://x")
    assert asyncio.run(adapter._dispatch("space.resources", {"spaceId": "g", "kind": "role"})) == []
    assert asyncio.run(
        adapter._dispatch("space.member.permissions", {"spaceId": "g", "userId": "u"})
    ) == {"permissions": []}


def test_permissions_dispatch():
    adapter = Adapter(bot_id="b", secret="s", gateway="ws://x")
    adapter.on_permissions(lambda space_id, user_id: ["MANAGE_GUILD"] if user_id == "u1" else [])
    result = asyncio.run(adapter._dispatch("space.member.permissions", {"spaceId": "g", "userId": "u1"}))
    assert result == {"permissions": ["MANAGE_GUILD"]}
