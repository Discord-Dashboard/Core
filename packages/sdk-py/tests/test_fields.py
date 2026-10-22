import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from discord_dashboard import f, define_settings, to_wire


def test_field_factories():
    assert f.text(label="Prefix", max=3)["type"] == "text"
    assert f.switch(default=True)["type"] == "switch"
    assert f.channel(types=["text"]) == {
        "type": "ref",
        "kind": "channel",
        "filter": {"types": ["text"]},
    }
    assert f.role(multiple=True) == {"type": "ref", "kind": "role", "multiple": True}


def test_ref_fields_keep_kind_and_filter_on_the_wire():
    schema = define_settings({
        "general": {
            "name": "General",
            "options": {"log": f.ref("channel", multiple=True, filter={"types": ["text"]})},
        }
    })
    opt = to_wire(schema)["categories"][0]["options"][0]
    assert opt == {
        "id": "log",
        "type": "ref",
        "kind": "channel",
        "multiple": True,
        "filter": {"types": ["text"]},
    }


def test_select_serializes_enum():
    schema = define_settings({
        "general": {
            "name": "General",
            "options": {
                "level": f.select({"off": "Off", "high": "High"}),
            },
        }
    })
    wire = to_wire(schema)
    assert wire["version"] == "1.0"
    cat = wire["categories"][0]
    assert cat["id"] == "general"
    opt = cat["options"][0]
    assert opt["type"] == "select"
    assert opt["enum"] == [
        {"value": "off", "label": "Off"},
        {"value": "high", "label": "High"},
    ]
