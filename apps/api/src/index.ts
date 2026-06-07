import { loadConfig } from "./config.js"
import { buildServer } from "./server.js"
import { startGateway } from "./gateway/gateway.js"

async function main() {
  const config = loadConfig()
  const app = await buildServer(config)
  await app.listen({ port: config.port, host: "0.0.0.0" })
  startGateway(app.server)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
