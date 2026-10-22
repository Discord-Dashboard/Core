# discord-dashboard (Python SDK)

Connect a Python bot to the discord-dashboard gateway.

```python
from discord_dashboard import Adapter, f, define_settings

schema = define_settings({
    "general": {
        "name": "General",
        "options": {
            "prefix": f.text(label="Prefix", max=3),
            "log_channel": f.channel(types=["text"]),
        },
    }
})

adapter = Adapter(bot_id="my-bot", secret="...", gateway="ws://localhost:3001/gateway")
adapter.settings(schema)
adapter.on_get(lambda space_id, key: store.get(space_id, key))
adapter.on_set(lambda space_id, key, value: store.set(space_id, key, value))
adapter.run()
```

Handlers get the space id first. A handler that also declares `platform` or
`actor` (or `**kwargs`) receives the platform id, such as `"discord"`, and the
acting user as keyword arguments. `f.ref("channel", multiple=True,
filter={"types": ["text"]})` is the picker field; `f.channel` and `f.role` are
aliases of it.
