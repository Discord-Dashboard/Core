import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from discord_dashboard import f, define_settings, to_wire

schema = define_settings(
    {
        "general": {
            "name": "General",
            "options": {
                "prefix": f.text(label="Prefix"),
                "level": f.select({"off": "Off", "high": "High"}),
            },
        }
    }
)
print(json.dumps(to_wire(schema)))
