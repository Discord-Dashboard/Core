import type { Page } from "@discord-dashboard/builder/schema"

export type PageStatus = "draft" | "published"

export interface StoredPage {
  slug: string
  content: Page
  version: number
  status: PageStatus
}

// Stores builder pages. Lite mode keeps them in memory; the platform profile
// swaps this for the db backed pages table behind the same interface.
export interface PageStore {
  get(slug: string): StoredPage | undefined
  put(slug: string, content: Page, status: PageStatus): StoredPage
  list(): StoredPage[]
  remove(slug: string): boolean
}

export class MemoryPageStore implements PageStore {
  private readonly pages = new Map<string, StoredPage>()

  get(slug: string) {
    return this.pages.get(slug)
  }
  put(slug: string, content: Page, status: PageStatus): StoredPage {
    const previous = this.pages.get(slug)
    const page: StoredPage = {
      slug,
      content,
      status,
      version: (previous?.version ?? 0) + 1,
    }
    this.pages.set(slug, page)
    return page
  }
  list() {
    return [...this.pages.values()]
  }
  remove(slug: string) {
    return this.pages.delete(slug)
  }
}
