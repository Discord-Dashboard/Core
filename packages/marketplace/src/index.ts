export interface ListingAuthor {
  id: string
  name: string
  connectAccountId?: string
}

export interface Listing {
  id: string
  kind: "module" | "theme"
  name: string
  version: string
  author: ListingAuthor
  priceCents: number
  signature: string
  sandboxPolicy?: string
}

// Simple in memory registry. Paid listings sell through the author connect
// account with a platform application fee. Untrusted module code runs in a
// sandbox per its declared policy.
export class Marketplace {
  private readonly listings = new Map<string, Listing>()

  publish(listing: Listing) {
    this.listings.set(listing.id, listing)
    return listing
  }
  get(id: string) {
    return this.listings.get(id) ?? null
  }
  list(kind?: Listing["kind"]) {
    const all = [...this.listings.values()]
    return kind ? all.filter((l) => l.kind === kind) : all
  }
}
