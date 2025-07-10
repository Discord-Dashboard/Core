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
        '/': { title: "HomePage", description: "Hello, world!" },
        '/commands': { title: "Commands", description: "Commands!!!" },
        '404': { title: "Not Found :(", description: "Website not found!!!" }
    }
}

export default theme;