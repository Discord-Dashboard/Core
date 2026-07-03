from discord_dashboard import Adapter, f, define_settings

store = {}

schema = define_settings(
    {
        "general": {
            "name": "General",
            "options": {
                "prefix": f.text(label="Prefix", max=3),
                "log_channel": f.channel(types=["text"]),
            },
        }
    }
)

adapter = Adapter(
    bot_id="example-bot",
    secret="dev-secret",
    gateway="ws://localhost:3001/gateway",
)
adapter.settings(schema)
adapter.on_get(lambda guild_id, key: store.get((guild_id, key)))
adapter.on_set(lambda guild_id, key, value: store.__setitem__((guild_id, key), value))

if __name__ == "__main__":
    adapter.run()
