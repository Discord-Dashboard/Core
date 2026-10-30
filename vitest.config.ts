import { defineConfig } from "vitest/config"
import path from "node:path"
import fs from "node:fs"

const pkg = (name: string, rel: string) => ({
  find: name,
  replacement: path.resolve(__dirname, rel),
})

// Resolve workspace packages to their TypeScript source and let ESM style .js
// imports resolve to the sibling .ts file, so tests run without a full install.
export default defineConfig({
  resolve: {
    alias: [
      pkg("@acstane/protocol", "packages/protocol/src/index.ts"),
      pkg("@acstane/schema", "packages/schema/src/index.ts"),
      pkg("@acstane/core", "packages/core/src/index.ts"),
      pkg("@acstane/platform-discord", "packages/platforms/discord/src/index.ts"),
      pkg("@acstane/sdk-js", "packages/sdk-js/src/index.ts"),
      pkg("@acstane/compat-v2", "packages/compat-v2/src/index.ts"),
      pkg("@acstane/db", "packages/db/src/index.ts"),
      pkg("@acstane/dashboard-ui", "packages/ui/src/index.ts"),
      pkg("@acstane/theme-default", "packages/themes/default/src/index.ts"),
      pkg("@acstane/builder/schema", "packages/builder/src/schema.ts"),
      pkg("@acstane/builder/url", "packages/builder/src/url.ts"),
      pkg("@acstane/builder/ai", "packages/builder/src/ai.ts"),
      pkg("@acstane/builder", "packages/builder/src/index.ts"),
    ],
  },
  plugins: [
    {
      name: "resolve-js-to-ts",
      enforce: "pre",
      resolveId(source: string, importer?: string) {
        if (
          importer &&
          (source.startsWith("./") || source.startsWith("../")) &&
          source.endsWith(".js")
        ) {
          const candidate = path.resolve(
            path.dirname(importer),
            source.slice(0, -3) + ".ts"
          )
          if (fs.existsSync(candidate)) return candidate
        }
        return null
      },
    },
  ],
  test: {
    environment: "node",
    include: [
      "packages/**/src/**/*.test.ts",
      "apps/**/src/**/*.test.ts",
      "meta/**/src/**/*.test.ts",
    ],
  },
})
