"""Field factories mirroring the TypeScript schema package."""

from .protocol import WIRE_VERSION

PROTOCOL_VERSION = "2.0.0"


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

    def ref(self, kind, multiple=False, filter=None, **opts):
        """A pick of something in the space, such as a channel or a role."""
        field = {"type": "ref", "kind": kind, **opts}
        if multiple:
            field["multiple"] = True
        if filter:
            field["filter"] = filter
        return field

    # Aliases of ref for the alpha, with Discord's filter options.
    def channel(self, types=None, multiple=False, **opts):
        return self.ref("channel", multiple, {"types": types} if types else None, **opts)

    def role(self, multiple=False, **opts):
        return self.ref("role", multiple, **opts)


f = _Fields()


def define_settings(categories):
    return {"categories": categories}


def to_wire(settings):
    out = []
    for cid, category in settings["categories"].items():
        options = []
        for oid, field in category["options"].items():
            wire = {"id": oid, "type": field["type"]}
            for key in (
                "label",
                "description",
                "required",
                "entitlement",
                "default",
                "min",
                "max",
                "kind",
                "multiple",
                "filter",
            ):
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
