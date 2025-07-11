import { ThemeDefinition } from "@discord-dashboard/contracts";

import LandingPage from "./pages/LandingPage";
import CommandsPage from "./pages/CommandsPage"
import NotFoundPage from "./pages/NotFoundPage"

const theme: ThemeDefinition = {
    config: {},
    pages: {
        '/': LandingPage,
        '/commands': CommandsPage,
        '404': NotFoundPage
    },
    metadata: {
        '/': { title: "VeloTheme", description: "VeloTheme - Discord-Dashboard v3 theme." },
        '/commands': { title: "VeloTheme - Commands", description: "A complete list of bot's commands." },
        '404': { title: "VeloTheme - Not Found :(", description: "Requested resource doesn't exist or has been moved.", robots: { index: false, follow: false }, }
    }
}

export default theme;