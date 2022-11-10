const router = require("express").Router()
const fetch = require("node-fetch")
const DBDStats = require("../ExternalStatistics/index")

const DiscordOauth2 = require("discord-oauth2")
const oauth = new DiscordOauth2()

module.exports = (app, config, themeConfig) => {
    const scopes = config.guildAfterAuthorization?.use
        ? ["identify", "guilds", "guilds.join"]
        : ["identify", "guilds"]
    const RL = require("express-rate-limit")
    const RateLimits = config.rateLimits || {}
    let RateFunctions = {}

    const NoRL = (req, res, next) => next()

    if (RateLimits.discordOAuth2) {
        RateFunctions.discordOAuth2 = RL.rateLimit({
            windowMs: RateLimits.discordOAuth2.windowMs,
            max: RateLimits.discordOAuth2.max,
            message: RateLimits.discordOAuth2.message,
            store: RateLimits.discordOAuth2.store || new RL.MemoryStore(),
        })
    }

    router.get("/", (req, res) => {
        const clientId = req.client.id
        const redirectUri = req.redirectUri

        let newPage = "/"
        if (themeConfig.landingPage?.enabled) newPage = "/dash"
        req.session.r = req.query.r || newPage

        const authorizeUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
            redirectUri
        )}&response_type=code&scope=${scopes.join("%20")}`
        res.redirect(authorizeUrl)
    })

    router.get("/status", async (req, res) => {
        res.send(req.session?.discordAuthStatus)
    })

    router.get(
        "/callback",
        RateFunctions.discordOAuth2 ? RateFunctions.discordOAuth2 : NoRL,
        async (req, res) => {
            req.session.discordAuthStatus = {
                loading: true,
                success: null,
                state: {
                    error: null,
                    data: null,
                },
            }
            const clientId = req.client.id
            const clientSecret = req.client.secret
            const redirectUri = req.redirectUri

            const accessCode = req.query.code
            if (!accessCode)
                return res.redirect("/?error=NoAccessCodeReturnedFromDiscord")

            res.redirect("/loading")

            let OAuth2Response
            let OAuth2UserResponse
            let OAuth2GuildsResponse

            /*
        Get Discord OAuth2 API Response with Access Code gained
        */
            try {
                req.session.discordAuthStatus = {
                    loading: true,
                    success: null,
                    state: {
                        error: null,
                        data: "Requesting token...",
                    },
                }
                req.session.save(function (err) {})
                OAuth2Response = await oauth.tokenRequest({
                    clientId,
                    clientSecret,

                    code: accessCode,
                    scope: scopes.join(" "),
                    grantType: "authorization_code",

                    redirectUri,
                })
            } catch (err) {
                req.config.reportError(
                    "Discord.js Route - OAuth2Response (line 86)",
                    err
                )
                req.session.discordAuthStatus = {
                    loading: false,
                    success: false,
                    state: {
                        error: err,
                        data: null,
                    },
                }
                req.session.save(function (err) {})
                return
            }

            /*
        Get User from Discord OAuth2 API using gained access_token and update its values with tag and avatarURL
        */

            try {
                req.session.discordAuthStatus = {
                    loading: true,
                    success: null,
                    state: {
                        error: null,
                        data: "Getting User...",
                    },
                }
                req.session.save(function (err) {})
                OAuth2UserResponse = await oauth.getUser(
                    OAuth2Response.access_token
                )
            } catch (err) {
                req.config.reportError(
                    "Discord.js Route - OAuth2UserResponse (line 118)",
                    err
                )
                req.session.discordAuthStatus = {
                    loading: false,
                    success: false,
                    state: {
                        error: err,
                        data: null,
                    },
                }
                req.session.save(function (err) {})
                return
            }
            OAuth2UserResponse.tag = `${OAuth2UserResponse.username}#${OAuth2UserResponse.discriminator}`
            OAuth2UserResponse.avatarURL = OAuth2UserResponse.avatar
                ? `https://cdn.discordapp.com/avatars/${OAuth2UserResponse.id}/${OAuth2UserResponse.avatar}.png?size=1024`
                : null

            /*
        Save user token in Assistants Secure Storage
        */

            try {
                req.AssistantsSecureStorage.SaveUser(
                    OAuth2UserResponse.id,
                    OAuth2Response.access_token
                )
            } catch (err) {
                req.config.reportError(
                    "Discord.js Route - Assistants Secure Storage (line 141)",
                    err
                )
                req.session.discordAuthStatus = {
                    loading: false,
                    success: false,
                    state: {
                        error: err,
                        data: null,
                    },
                }
                req.session.save(function (err) {})
                return
            }

            /*
        Save user in session
        */

            req.session.user = OAuth2UserResponse
            req.session.loggedInLastTime = true

            /*
        Register user to DBD Stats and emit userLoggedIn event
        */

            try {
                DBDStats.registerUser(OAuth2UserResponse.id)
                req.DBDEvents.emit("userLoggedIn", OAuth2UserResponse)
            } catch (err) {
                req.config.reportError(
                    "Discord.js Route - DBDStats register and DBDEvent emit userLoggedIn (line 170)",
                    err
                )
                req.session.discordAuthStatus = {
                    loading: false,
                    success: false,
                    state: {
                        error: err,
                        data: null,
                    },
                }
                req.session.save(function (err) {})
                return
            }

            /*
        Gain and update session with user guilds
        */

            try {
                req.session.discordAuthStatus = {
                    loading: true,
                    success: null,
                    state: {
                        error: null,
                        data: "Getting List of User Guilds...",
                    },
                }
                req.session.save(function (err) {})
                OAuth2GuildsResponse = await oauth.getUserGuilds(
                    OAuth2Response.access_token
                )
            } catch (err) {
                req.config.reportError(
                    "Discord.js Route - OAuth2GuildsResponse (line 201)",
                    err
                )
                req.session.discordAuthStatus = {
                    loading: false,
                    success: false,
                    state: {
                        error: err,
                        data: null,
                    },
                }
                req.session.save(function (err) {})
                return
            }
            req.session.guilds = OAuth2GuildsResponse || []

            /*
        Loop and fetch each guild into bots cache
         */

            if (!req.config.disableResolvingGuildCache) {
                try {
                    req.session.discordAuthStatus = {
                        loading: true,
                        success: null,
                        state: {
                            error: null,
                            data: "Resolving guilds cache...",
                        },
                    }
                    req.session.save(function (err) {})
                    for (let g of OAuth2GuildsResponse) {
                        try {
                            await req.bot.guilds.fetch(g.id)
                        } catch (err) {}
                    }
                } catch (err) {
                    req.config.reportError(
                        "Discord.js Route - OAuth2GuildsResponse Whole Loop (line 239)",
                        err
                    )
                    req.session.discordAuthStatus = {
                        loading: false,
                        success: false,
                        state: {
                            error: err,
                            data: null,
                        },
                    }
                    req.session.save(function (err) {})
                    return
                }
            }

            /*
        If joining specific guild after authorization is enabled, do it
         */

            if (req.guildAfterAuthorization.use == true) {
                req.session.discordAuthStatus = {
                    loading: true,
                    success: null,
                    state: {
                        error: null,
                        data: "Authorizing user with guild...",
                    },
                }
                req.session.save(function (err) {})
                try {
                    await oauth.addMember({
                        accessToken: OAuth2Response.access_token,
                        botToken: req.botToken,
                        guildId: req.guildAfterAuthorization.guildId,
                        userId: OAuth2UserResponse.id,

                        ...(req.guildAfterAuthorization.options || {}),
                        /*
                    options?: {
                        nickname?: string,
                        roles?: [string],
                        mute?: boolean,
                        deaf?: boolean,
                    }
                    */
                    })
                } catch (err) {
                    req.config.reportError(
                        "Discord.js Route - guildAfterAuthorization (line 287)",
                        err
                    )
                }
            }

            req.session.discordAuthStatus = {
                loading: false,
                success: true,
                state: {
                    error: null,
                    data: null,
                },
            }
            req.session.save(function (err) {})

            return
        }
    )

    router.get("/logout", (req, res) => {
        let r = req.query.r || "/"
        req.session.destroy()
        res.redirect(r)
    })

    router.get("/guilds/reload", async (req, res) => {
        if (!req.session.user) return res.redirect("/discord")

        /*
        Fetch user token
         */

        const access_token = req.AssistantsSecureStorage.GetUser(
            req.session.user.id
        )
        if (!access_token)
            return res.send({
                error: true,
                message: "You don't have any access_token saved.",
                login_again_text: true,
            })

        /*
        Gain and update session with user guilds
        */

        let OAuth2GuildsResponse

        try {
            OAuth2GuildsResponse = await oauth.getUserGuilds(access_token)
        } catch (err) {
            req.config.reportError(
                "Discord.js Route - OAuth2GuildsResponse for ReloadGuilds (line 335)",
                err
            )
            return res.send({
                error: true,
                message:
                    "An error occured. Access_token is wrong or you're being rate limited.",
                login_again_text: true,
            })
        }
        req.session.guilds = OAuth2GuildsResponse || []

        /*
        Loop and fetch each guild into bots cache
         */

        try {
            const Promises = []
            for (let g of OAuth2GuildsResponse) {
                Promises.push(
                    new Promise(async (resolve, reject) => {
                        try {
                            await req.bot.guilds.fetch(g.id)
                        } catch (err) {}
                        resolve(1)
                    })
                )
                try {
                    await Promises.all(Promises)
                } catch (err) {}
            }
        } catch (err) {
            req.config.reportError(
                "Discord.js Route - OAuth2GuildsResponse Whole Loop for ReloadGuilds (line 363)",
                err
            )
            return res.send({
                error: true,
                message:
                    "An error occured. Access_token is wrong or you're being rate limited.",
                login_again_text: true,
            })
        }

        /*
        Success
         */

        return res.send({
            error: false,
            message: null,
            login_again_text: false,
        })
    })

    return router
}
