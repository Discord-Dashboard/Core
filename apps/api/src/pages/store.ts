import type { Page } from "@discord-dashboard/builder/schema"

export enum PageStatus {
  Draft = "draft",
  Published = "published",
}

export interface StoredPage {
  slug: string
  content: Page
  version: number
  status: PageStatus
}

// Stores builder pages with their version history. Lite mode keeps them in
// memory; the platform profile swaps this for the db backed pages table behind
// the same interface.
export interface PageStore {
  get(slug: string): StoredPage | undefined
  put(slug: string, content: Page, status: PageStatus): StoredPage
  list(): StoredPage[]
  remove(slug: string): boolean
  // Every stored version of a page, newest first.
  history(slug: string): StoredPage[]
  // Restore an earlier version as a new current version.
  restore(slug: string, version: number): StoredPage | undefined
}

export class MemoryPageStore implements PageStore {
  private readonly versions = new Map<string, StoredPage[]>()

  private latest(slug: string): StoredPage | undefined {
    const list = this.versions.get(slug)
    return list?.[list.length - 1]
  }

  get(slug: string) {
    return this.latest(slug)
  }
  put(slug: string, content: Page, status: PageStatus): StoredPage {
    const list = this.versions.get(slug) ?? []
    const page: StoredPage = {
      slug,
      content,
      status,
      version: (list[list.length - 1]?.version ?? 0) + 1,
    }
    list.push(page)
    this.versions.set(slug, list)
    return page
  }
  list() {
    return [...this.versions.values()]
      .map((v) => v[v.length - 1])
      .filter((p): p is StoredPage => Boolean(p))
  }
  remove(slug: string) {
    return this.versions.delete(slug)
  }
  history(slug: string) {
    return [...(this.versions.get(slug) ?? [])].reverse()
  }
  restore(slug: string, version: number) {
    const list = this.versions.get(slug)
    const target = list?.find((p) => p.version === version)
    if (!target) return undefined
    // Bring the old content back as a fresh version rather than rewriting.
    return this.put(slug, target.content, target.status)
  }
}
