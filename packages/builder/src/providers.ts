import type { LlmClient } from "./ai.js"

export interface HttpLlmOptions {
  endpoint: string
  apiKey: string
  model: string
}

// Provider agnostic client. Any completion endpoint that accepts a prompt and
// returns text works. The provider is configured, never hard coded.
export function httpLlm(opts: HttpLlmOptions): LlmClient {
  return {
    async complete(prompt, catalog) {
      const res = await fetch(opts.endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${opts.apiKey}`,
        },
        body: JSON.stringify({ model: opts.model, prompt, catalog }),
      })
      const data = (await res.json()) as { output?: string }
      return String(data.output ?? "")
    },
  }
}

// Deterministic client for tests and offline development.
export const MockLlm: LlmClient = {
  async complete() {
    return JSON.stringify({
      version: 1,
      root: { title: "Generated page" },
      content: [{ type: "Heading", props: { text: "Hello" } }],
    })
  },
}
