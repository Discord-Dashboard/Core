import { describe, it, expect } from "vitest"
import { discordSourceFromClient } from "./discord-source.js"

// A minimal fake discord.js client shaped like the parts the mapper reads.
function fakeClient() {
  const guild = {
    channels: {
      cache: new Map([
        ["c1", { id: "c1", name: "general", type: "0" }],
        ["c2", { id: "c2", name: "voice", type: "2" }],
      ]),
    },
    roles: {
      cache: new Map([
        ["g", { id: "g", name: "@everyone" }],
        ["r1", { id: "r1", name: "mod" }],
      ]),
    },
    members: {
      cache: new Map([
        ["u1", { permissions: { toArray: () => ["ManageGuild", "KickMembers"] } }],
      ]),
    },
  }
  return { guilds: { cache: new Map([["g", guild]]) } }
}

describe("discordSourceFromClient", () => {
  it("filters channels by type", async () => {
    const src = discordSourceFromClient(fakeClient())
    const channels = await src.channels("g", { types: ["0"] })
    expect(channels).toEqual([{ label: "general", value: "c1" }])
  })
  it("lists roles and excludes the everyone role", async () => {
    const src = discordSourceFromClient(fakeClient())
    const roles = await src.roles("g")
    expect(roles).toEqual([{ label: "mod", value: "r1" }])
  })
  it("maps member permissions to an array", async () => {
    const src = discordSourceFromClient(fakeClient())
    const perms = await src.memberPermissions("g", "u1")
    expect(perms).toEqual(["ManageGuild", "KickMembers"])
  })
  it("returns empty lists for an unknown guild", async () => {
    const src = discordSourceFromClient(fakeClient())
    expect(await src.channels("nope")).toEqual([])
    expect(await src.roles("nope")).toEqual([])
  })
})

import { describe as d6, it as i6, expect as e6 } from "vitest"
import { discordSourceFromClient as dsc6 } from "./discord-source.js"

function clientWithNsfw() {
  const guild = {
    channels: {
      cache: new Map([
        ["c1", { id: "c1", name: "general", type: "0", nsfw: false }],
        ["c2", { id: "c2", name: "spicy", type: "0", nsfw: true }],
      ]),
    },
    roles: { cache: new Map() },
    members: { cache: new Map() },
  }
  return { guilds: { cache: new Map([["g", guild]]) } }
}

d6("channel nsfw filtering", () => {
  i6("hides nsfw channels when asked", async () => {
    const src = dsc6(clientWithNsfw())
    const channels = await src.channels("g", { hideNsfw: true })
    e6(channels.map((c) => c.value)).toEqual(["c1"])
  })
  i6("returns only nsfw channels when asked", async () => {
    const src = dsc6(clientWithNsfw())
    const channels = await src.channels("g", { onlyNsfw: true })
    e6(channels.map((c) => c.value)).toEqual(["c2"])
  })
})
