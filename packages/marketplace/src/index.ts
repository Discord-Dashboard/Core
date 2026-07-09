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

// Verifies a listing's signature against its payload. Supplied by the platform,
// which knows the author signing keys. When absent, signatures are not checked
// (single tenant, trusted publisher).
export type ListingVerifier = (listing: Listing) => boolean

// Simple in memory registry. Paid listings sell through the author connect
// account with a platform application fee. Untrusted module code runs in a
// sandbox per its declared policy.
export class Marketplace {
  private readonly listings = new Map<string, Listing>()

  constructor(private readonly verify?: ListingVerifier) {}

  publish(listing: Listing) {
    const existing = this.listings.get(listing.id)
    // An id belongs to its first author: another author cannot overwrite the
    // listing and redirect its Connect payout or downgrade its price.
    if (existing && existing.author.id !== listing.author.id) {
      throw new Error("listing id belongs to another author")
    }
    // A configured verifier must accept the signature before we store it.
    if (this.verify && !this.verify(listing)) {
      throw new Error("listing signature is invalid")
    }
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
