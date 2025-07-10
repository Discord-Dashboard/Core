import { ThemeDefinition } from "@discord-dashboard/contracts";
import TestPage from "./pages/TestPage";
import LandingPage from "./pages/LandingPage";

const theme: ThemeDefinition = {
    components: {},
    pages: {
        '/': LandingPage,
        '/test': TestPage
    }
}

export default theme;