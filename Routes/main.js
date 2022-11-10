const Discord = require("discord.js")
const router = require("express").Router()

module.exports = (app, config, themeConfig, modules) => {
    router.get(
        themeConfig.landingPage?.enabled ? "/dash" : "/",
        async (req, res) => {
            let customThemeOptions
            if (themeConfig?.customThemeOptions?.index) {
                customThemeOptions = await themeConfig.customThemeOptions.index(
                    { req: req, res: res, config: config }
                )
            }
            res.render("index", {
                req: req,
                themeConfig: req.themeConfig,
                bot: config.bot,
                customThemeOptions: customThemeOptions || {},
                config,
                require,
            })
        }
    )

    if (themeConfig.landingPage?.enabled)
        router.get("/", async (req, res) => {
            res.setHeader("Content-Type", "text/html")
            res.send(await themeConfig.landingPage.getLandingPage(req, res))
        })

    router.get("/loading", async (req, res) => {
        if (!req.session?.discordAuthStatus?.loading)
            return res.redirect("/manage")

        res.render("loading", { req, themeConfig, bot: config.bot })
    })

    router.get("/invite", (req, res) => {
        let config = req.config
        config.invite ? null : (config.invite = {})
        const scopes = config.invite.scopes || ["bot"]

        if (req.query.redirect && !req.query.g)
            return res.redirect(
                `https://discord.com/oauth2/authorize?client_id=${
                    config.invite.clientId || config.bot.user.id
                }&scope=${scopes.join("%20")}&permissions=${
                    config.invite.permissions || "0"
                }&response_type=code&redirect_uri=${req.query.redirect}${
                    config.invite.otherParams || ""
                }`
            )
        if (req.query.redirect && req.query.g)
            return res.redirect(
                `https://discord.com/oauth2/authorize?client_id=${
                    config.invite.clientId || config.bot.user.id
                }&scope=${scopes.join("%20")}&permissions=${
                    config.invite.permissions || "0"
                }&response_type=code&redirect_uri=${
                    req.query.redirect
                }&guild_id=${req.query.g}${config.invite.otherParams || ""}`
            )

        if (req.query.g)
            return res.redirect(
                `https://discord.com/oauth2/authorize?client_id=${
                    config.invite.clientId || config.bot.user.id
                }&scope=${scopes.join("%20")}&permissions=${
                    config.invite.permissions || "0"
                }${
                    config.invite.redirectUri
                        ? `&response_type=code&redirect_uri=${config.invite.redirectUri}`
                        : ""
                }&guild_id=${req.query.g}${config.invite.otherParams || ""}`
            )

        res.redirect(
            `https://discord.com/oauth2/authorize?client_id=${
                config.invite.clientId || config.bot.user.id
            }&scope=${scopes.join("%20")}&permissions=${
                config.invite.permissions || "0"
            }${
                config.invite.redirectUri
                    ? `&response_type=code&redirect_uri=${config.invite.redirectUri}`
                    : ""
            }${config.invite.otherParams || ""}`
        )
    })

    if (!config.supportServer) config.supportServer = {}

    router.get(config.supportServer.slash || "/support-server", (req, res) => {
        let config = req.config
        config.supportServer ? null : (config.supportServer = {})
        if (!config.supportServer.inviteUrl)
            return res.send({
                error: true,
                message:
                    "No inviteUrl defined (discord-dashboard config.supportServer).",
            })
        if (
            !config.supportServer.inviteUrl
                .toLowerCase()
                .startsWith("https://discord.gg/") &&
            !config.supportServer.inviteUrl
                .toLowerCase()
                .startsWith("https://discord.com/")
        )
            return res.send({
                error: true,
                message:
                    "Invite url should start with 'https://discord.gg/' or 'https://discord.com/'.",
            })
        res.redirect(config.supportServer.inviteUrl)
    })

    return router
}
