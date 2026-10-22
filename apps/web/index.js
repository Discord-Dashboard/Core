import { fileURLToPath } from "node:url"

// The prebuilt dashboard: a static export of this app, which createDashboard
// serves on the API's own port.
export const webRoot = fileURLToPath(new URL("./out/", import.meta.url))
