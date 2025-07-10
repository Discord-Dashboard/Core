import { ThemeDefinition } from "@discord-dashboard/contracts";

import LandingPage from "./pages/LandingPage";
import CommandsPage from "./pages/CommandsPage"

const theme: ThemeDefinition = {
    config: {},
    pages: {
        '/': LandingPage,
        '/commands': CommandsPage,
        '/cmds': CommandsPage
    }
}

export default theme;