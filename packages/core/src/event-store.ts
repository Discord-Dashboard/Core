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
  // Per key index into that key's event list marking the current value. This
  // lets successive rollbacks walk backward through history instead of
  // oscillating between the last two values.
  private readonly cursor = new Map<string, number>()

  constructor(
    private readonly base: KeyValueStore = new MemoryStore(),
    private readonly clock: () => number = () => Date.now()
  ) {}

  async get(key: string) {
    return this.base.get(key)
  }

  async set(key: string, value: unknown) {
    this.events.push({ key, value, at: this.clock() })
    // A fresh write moves the cursor back to the latest event.
    this.cursor.set(key, this.history(key).length - 1)
    await this.base.set(key, value)
  }

  history(key?: string): ChangeEvent[] {
    return key ? this.events.filter((e) => e.key === key) : [...this.events]
  }

  // Steps the key one entry back through its history. Calling it repeatedly
  // walks all the way back to the first recorded value. A later set() returns
  // to the latest. History itself is never rewritten, so the audit trail stays
  // intact.
  async rollback(key: string): Promise<boolean> {
    const h = this.history(key)
    const pos = this.cursor.get(key) ?? h.length - 1
    if (pos <= 0) return false
    const next = pos - 1
    this.cursor.set(key, next)
    await this.base.set(key, h[next]!.value)
    return true
  }
}
