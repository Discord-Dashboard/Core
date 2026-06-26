import { pageSchema, type Page } from "./schema.js"

export interface LlmClient {
  // Returns a JSON string the model produced for the given instruction.
  complete(prompt: string, catalog: string[]): Promise<string>
}

export interface GenerateResult {
  ok: boolean
  page?: Page
  error?: string
}

// The AI builder generates a validated page, not code. Invalid output is fed
// back for repair up to a few times, then rejected.
export async function generatePage(
  llm: LlmClient,
  intent: string,
  catalog: string[],
  maxAttempts = 3
): Promise<GenerateResult> {
  let lastError = "no attempts"
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const raw = await llm.complete(
      `${intent}\nReturn JSON for a page using only these components: ${catalog.join(", ")}.` +
        (attempt > 0 ? `\nThe previous output was invalid: ${lastError}` : ""),
      catalog
    )
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      lastError = "not valid json"
      continue
    }
    const result = pageSchema.safeParse(parsed)
    if (result.success) return { ok: true, page: result.data }
    lastError = result.error.message
  }
  return { ok: false, error: lastError }
}
