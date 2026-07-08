import { MemoryStore, type KeyValueStore } from "./inprocess.js"

export interface ChangeEvent {
  key: string
  value: unknown
  at: number
}

// A key value store that records every write as an immutable event. This gives
// an audit trail, history and rollback without changing callers. It is the
// foundation for the config as data profile.
export class EventSourcedStore implements KeyValueStore {
  private readonly events: ChangeEvent[] = []

  constructor(
    private readonly base: KeyValueStore = new MemoryStore(),
    private readonly clock: () => number = () => Date.now()
  ) {}

  async get(key: string) {
    return this.base.get(key)
  }

  async set(key: string, value: unknown) {
    this.events.push({ key, value, at: this.clock() })
    await this.base.set(key, value)
  }

  history(key?: string): ChangeEvent[] {
    return key ? this.events.filter((e) => e.key === key) : [...this.events]
  }

  // Reverts a key to the value it had before the most recent change.
  async rollback(key: string): Promise<boolean> {
    const h = this.history(key)
    if (h.length < 2) return false
    await this.set(key, h[h.length - 2]!.value)
    return true
  }
}
