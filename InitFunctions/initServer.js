const https = require("https")
const http = require("http")
const { Server: SocketServer } = require("socket.io")

const err = (text) => {
    return (
        text +
        ` Do you need help? Join our Discord server: ${
            "https://discord.gg/CzfMGtrdaA".blue
        }`
    )
}

module.exports = (app, config, themeConfig, modules) => {
    if (config.noCreateServer) return { io: null, server: null }
    let server

    if (!config.SSL) config.SSL = {}
    if (config.SSL.enabled) {
        if (!config.SSL.key || !config.SSL.cert)
            console.log(
                err(
                    `${
                        "discord-dashboard issue:".red
                    } The SSL preference for Dashboard is selected (config.SSL.enabled), but config does not include key or cert (config.SSL.key, config.SSL.cert).`
                )
            )
        let options = {
            key: config.SSL.key || "",
            cert: config.SSL.cert || "",
        }
        try {
            const https = require("https")
            server = https.createServer(options, app)
        } catch (e) {
            console.log(
                err(
                    `${
                        "discord-dashboard issue:".red
                    } There's a problem while creating server, check if the port specified is already on use.`
                )
            )
        }
    } else {
        const http = require("http")
        server = http.createServer(app)
    }

    let pport = ""
    if (config.port != 80 && config.port != 443) {
        pport = `:${config.port}`
    }

    if (!config.minimizedConsoleLogs) {
        console.log(
            `
██████╗ ██████╗ ██████╗ 
██╔══██╗██╔══██╗██╔══██╗
██║  ██║██████╔╝██║  ██║
██║  ██║██╔══██╗██║  ██║
██████╔╝██████╔╝██████╔╝
╚═════╝ ╚═════╝ ╚═════╝ 
Discord Bot Dashboard
`.rainbow +
                `
Thanks for using ${
                    "discord-dashboard".rainbow
                } module! The server is up and running, so head over to the ${
                    `${(config.domain || "domain.com") + pport}`.blue
                } website and start your fun.

Remember that there are ${
                    "themes".rainbow
                } available to make the Dashboard look better: ${
                    "https://dbd-docs.assistantscenter.com/#/?id=themes".blue
                }

If you need help with something or you don't understand something, please visit our ${
                    "Discord Support Server".rainbow
                }: ${"https://discord.gg/CzfMGtrdaA".blue}
`
        )
    } else {
        console.log(
            `DBD Dashboard running on ${
                `${(config.domain || "domain.com") + pport}`.blue
            } !`
        )
    }

    const SocketServer = require("socket.io").Server
    const io = new SocketServer(server, {
        cors: {
            origin: "*",
        },
    })

    modules.forEach((module) => {
        module.server({
            io: io,
            server: server,
            config: config,
            themeConfig: themeConfig,
        })
    })

    server.listen(config.port)
    return { server, io }
}
