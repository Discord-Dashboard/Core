"""Field factories mirroring the TypeScript schema package."""

from .protocol import WIRE_VERSION

PROTOCOL_VERSION = "1.0.0"


class _Fields:
    def text(self, **opts):
        return {"type": "text", **opts}

    def textarea(self, **opts):
        return {"type": "textarea", **opts}

    def number(self, **opts):
        return {"type": "number", **opts}

    def switch(self, **opts):
        return {"type": "switch", **opts}

    def select(self, options, **opts):
        return {"type": "select", "options": options, **opts}

    def channel(self, **opts):
        return {"type": "channel", **opts}

    def role(self, **opts):
        return {"type": "role", **opts}


f = _Fields()


def define_settings(categories):
    return {"categories": categories}


def to_wire(settings):
    out = []
    for cid, category in settings["categories"].items():
        options = []
        for oid, field in category["options"].items():
            wire = {"id": oid, "type": field["type"]}
            for key in ("label", "description", "required", "entitlement", "default", "min", "max"):
                if key in field:
                    wire[key] = field[key]
            if "options" in field:
                wire["enum"] = [
                    {"value": v, "label": lbl} for v, lbl in field["options"].items()
                ]
            options.append(wire)
        out.append(
            {
                "id": cid,
                "name": category.get("name", cid),
                "description": category.get("description"),
                "entitlement": category.get("entitlement"),
                "options": options,
            }
        )
    return {"version": WIRE_VERSION, "categories": out}
