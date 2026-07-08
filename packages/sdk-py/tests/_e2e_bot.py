import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from discord_dashboard import Adapter, f, define_settings

schema = define_settings(
    {
        "general": {
            "name": "General",
            "options": {"prefix": f.text(label="Prefix", max=3)},
        }
    }
)

adapter = Adapter(
    bot_id=os.environ["BOT_ID"],
    secret=os.environ["SECRET"],
    gateway=os.environ["GATEWAY"],
)
adapter.settings(schema)
adapter.on_get(lambda g, k: None)
adapter.on_set(lambda g, k, v: None)
adapter.run()
