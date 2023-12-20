module.exports = (app, config, themeConfig, modules) => {
    app.use(require("cookie-parser")())

    app.use((req, res, next) => {
        req.bot = config.bot
        if (req?.session?.user?.blacklisted && (req.url != "/blacklisted/") && (req.url != "/discord/logout/")) return res.redirect("/blacklisted")
        next()
    })

    if (themeConfig.defaultLocales) {
        app.use((req, res, next) => {
            if (req.cookies?.lang) req.lang = req.cookies.lang
            else req.lang = req.acceptsLanguages()[0].replace("-", "")

            if (themeConfig.locales) {
                if (Object.keys(themeConfig.locales).includes(req.lang)) {
                    req.locales = themeConfig.locales[req.lang]
                } else {
                    req.locales =
                        themeConfig.locales[Object.keys(themeConfig.locales)[0]]
                }
            } else {
                req.locales =
                    themeConfig.defaultLocales[
                        Object.keys(themeConfig.defaultLocales).includes(
                            req.lang
                        )
                            ? req.lang
                            : "enUS"
                    ]
            }

            next()
        })
    }

    app.use(
        "/discord",
        require("./Routes/discord")(app, config, themeConfig, modules)
    )

    if (config.useUnderMaintenance) {
        app.get(
            config.underMaintenanceAccessPage || "/total-secret-get-access",
            (req, res) => {
                res.send(`
               <form action="${config.domain}${
                    config.underMaintenanceAccessPage ||
                    "/total-secret-get-access"
                }" method="POST" >
                    <input id="accessKey" name="accessKey"/>
                    <button role="submit">Submit</button>
               </form>
               `)
            }
        )

        app.post(
            config.underMaintenanceAccessPage || "/total-secret-get-access",
            (req, res) => {
                if (!req.body) req.body = {}
                const accessKey = req.body.accessKey
                if (accessKey != config.underMaintenanceAccessKey)
                    return res.send("Wrong key.")
                req.session.umaccess = true
                res.redirect("/")
            }
        )

        app.use((req, res, next) => {
            if (req.originalUrl.startsWith("/loading")) return next()
            if (!req.session.umaccess && !req.session.user) {
                if (!config.useThemeMaintenance)
                    return res.send(
                        config.underMaintenanceCustomHtml ||
                            require("./underMaintenancePageDefault")(
                                config.underMaintenance,
                                false
                            )
                    )
                else
                    res.render("maintenance", {
                        req: req,
                        bot: config.bot,
                        themeConfig: req.themeConfig,
                        loggedIn: false,
                        defaultMaintenanceConfig: config.underMaintenance || {},
                    })
            } else if (
                !req.session.umaccess &&
                config.ownerIDs &&
                !config.ownerIDs.includes(req.session.user.id)
            ) {
                if (!config.useThemeMaintenance)
                    return res.send(
                        config.underMaintenanceCustomHtml ||
                            require("./underMaintenancePageDefault")(
                                config.underMaintenance,
                                true
                            )
                    )
                else
                    res.render("maintenance", {
                        req: req,
                        bot: config.bot,
                        themeConfig: req.themeConfig,
                        loggedIn: true,
                        defaultMaintenanceConfig: config.underMaintenance || {},
                    })
            } else next()
        })
    }

    app.use("/", require("./Routes/main")(app, config, themeConfig, modules))
    app.use(
        "/",
        require("./Routes/dashboard")(app, config, themeConfig, modules)
    )

    config.theme.init(app, config)

    let customPages = config.customPages || []
    customPages.forEach((p) => {
        if (p.type == "redirect") {
            app.get(p.endpoint, async (req, res) => {
                let endpoint = await p.getEndpoint({
                    user: req.session.user || {},
                    req,
                })
                res.redirect(endpoint)
            })
        } else if (p.type == "html") {
            app.get(p.endpoint, async (req, res) => {
                let html = await p.getHtml({
                    user: req.session.user || {},
                    req,
                })
                res.send(html)
            })
        } else if (p.type == "json") {
            app.get(p.endpoint, async (req, res) => {
                let json = await p.getJson({
                    user: req.session.user || {},
                    req,
                })
                res.send(json)
            })
        }
    })

    modules.forEach((module) => {
        module.app({
            app: app,
            config: this.config,
            themeConfig: themeConfig,
        })
    })

    if (!config.useTheme404) {
        app.get("*", (req, res) => {
            let text =
                config.html404 ||
                require("./404pagedefault")(
                    config.websiteTitle || themeConfig.websiteName
                )
            res.send(
                text.replace(
                    "{{websiteTitle}}",
                    config.websiteTitle || themeConfig.websiteName
                )
            )
        })
    }
}
