const { PermissionFlagsBits } = require("discord.js")
const Discord = require("discord.js")
const router = require("express").Router()

module.exports = (app, config, themeConfig) => {
    const RL = require("express-rate-limit")
    const RateLimits = config.rateLimits || {}
    let RateFunctions = {}

    const NoRL = (req, res, next) => next()

    if (RateLimits.manage) {
        RateFunctions.manage = RL.rateLimit({
            windowMs: RateLimits.manage.windowMs,
            max: RateLimits.manage.max,
            message: RateLimits.manage.message,
            store: RateLimits.manage.store || new RL.MemoryStore(),
        })
    }

    if (RateLimits.guildPage) {
        RateFunctions.guildPage = RL.rateLimit({
            windowMs: RateLimits.guildPage.windowMs,
            max: RateLimits.guildPage.max,
            message: RateLimits.guildPage.message,
            store: RateLimits.guildPage.store || new RL.MemoryStore(),
        })
    }

    if (RateLimits.settingsUpdatePostAPI) {
        RateFunctions.settingsUpdatePostAPI = RL.rateLimit({
            windowMs: RateLimits.settingsUpdatePostAPI.windowMs,
            max: RateLimits.settingsUpdatePostAPI.max,
            message: RateLimits.settingsUpdatePostAPI.message,
            store:
                RateLimits.settingsUpdatePostAPI.store || new RL.MemoryStore(),
        })
    }

    router.get(
        "/manage",
        RateFunctions.manage ? RateFunctions.manage : NoRL,
        async (req, res) => {
            if (!req.session.user) return res.redirect("/discord?r=/manage")
            let customThemeOptions
            if (themeConfig?.customThemeOptions?.manage) {
                customThemeOptions =
                    await themeConfig.customThemeOptions.manage({
                        req: req,
                        res: res,
                        config: config,
                    })
            }
            res.render("guilds", {
                req: req,
                bot: config.bot,
                themeConfig: req.themeConfig,
                customThemeOptions: customThemeOptions || {},
                config,
            })
        }
    )

    router.get(
        "/guild/:id",
        RateFunctions.guildPage ? RateFunctions.guildPage : NoRL,
        async (req, res) => {
            if (!req.session.user)
                return res.redirect("/discord?r=/guild/" + req.params.id)
            let customThemeOptions
            if (themeConfig?.customThemeOptions?.getGuild) {
                customThemeOptions =
                    await themeConfig.customThemeOptions.getGuild({
                        req: req,
                        res: res,
                        config: config,
                        guildId: req.params.id,
                    })
            }
            let bot = config.bot
            if (!bot.guilds.cache.get(req.params.id)) {
                try {
                    await bot.guilds.fetch(req.params.id)
                } catch (err) {}
            }

            if (!bot.guilds.cache.get(req.params.id))
                return res.redirect("/manage?error=noPermsToManageGuild")
            if (
                !bot.guilds.cache
                    .get(req.params.id)
                    .members.cache.get(req.session.user.id)
            ) {
                try {
                    await bot.guilds.cache
                        .get(req.params.id)
                        .members.fetch(req.session.user.id)
                } catch (err) {}
            }
            for (let PermissionRequired of req.requiredPermissions) {
                let converted = PermissionRequired[0]
                const DiscordJsVersion = Discord.version.split(".")[0]

                if (DiscordJsVersion === "14")
                    converted = convert14(PermissionRequired[0])

                if (
                    !bot.guilds.cache
                        .get(req.params.id)
                        .members.cache.get(req.session.user.id)
                        .permissions.has(converted)
                )
                    return res.redirect("/manage?error=noPermsToManageGuild")
            }

            if (bot.guilds.cache.get(req.params.id).channels.cache.size < 1) {
                try {
                    await bot.guilds.cache.get(req.params.id).channels.fetch()
                } catch (err) {}
            }

            if (bot.guilds.cache.get(req.params.id).roles.cache.size < 2) {
                try {
                    await bot.guilds.cache.get(req.params.id).roles.fetch()
                } catch (err) {}
            }

            let actual = {}

            let canUseList = {}
            if (!config.useCategorySet)
                for (const s of config.settings) {
                    if (!canUseList[s.categoryId]) canUseList[s.categoryId] = {}
                    for (const c of s.categoryOptionsList) {
                        if (c.allowedCheck) {
                            const canUse = await c.allowedCheck({
                                guild: { id: req.params.id },
                                user: { id: req.session.user.id },
                            })
                            if (typeof canUse != "object")
                                throw new TypeError(
                                    `${s.categoryId} category option with id ${c.optionId} allowedCheck function need to return {allowed: Boolean, errorMessage: String | null}`
                                )
                            canUseList[s.categoryId][c.optionId] = canUse
                        } else {
                            canUseList[s.categoryId][c.optionId] = {
                                allowed: true,
                                errorMessage: null,
                            }
                        }

                        if (c.optionType == "spacer") {
                        } else {
                            if (!actual[s.categoryId]) {
                                actual[s.categoryId] = {}
                            }
                            if (!actual[s.categoryId][c.optionId]) {
                                actual[s.categoryId][c.optionId] =
                                    await c.getActualSet({
                                        guild: {
                                            id: req.params.id,
                                            object: bot.guilds.cache.get(
                                                req.params.id
                                            ),
                                        },
                                        user: {
                                            id: req.session.user.id,
                                            object: bot.guilds.cache
                                                .get(req.params.id)
                                                .members.cache.get(
                                                    req.session.user.id
                                                ),
                                        },
                                    })
                            }
                        }
                    }
                }
            else
                for (const category of config.settings) {
                    if (!canUseList[category.categoryId])
                        canUseList[category.categoryId] = {}
                    const catGAS = await category.getActualSet({
                        guild: {
                            id: req.params.id,
                            object: bot.guilds.cache.get(req.params.id),
                        },
                        user: {
                            id: req.session.user.id,
                            object: bot.guilds.cache
                                .get(req.params.id)
                                .members.cache.get(req.session.user.id),
                        },
                    })

                    for (const o of catGAS) {
                        if (!o || !o?.optionId)
                            console.log(
                                "WARNING: You haven't set the optionId for a category option in your config. This is required for the category option to work."
                            )
                        else {
                            const option = category.categoryOptionsList.find(
                                (c) => c.optionId == o.optionId
                            )
                            if (option) {
                                if (option.allowedCheck) {
                                    const canUse = await option.allowedCheck({
                                        guild: {
                                            id: req.params.id,
                                        },
                                        user: {
                                            id: req.session.user.id,
                                        },
                                    })
                                    if (typeof canUse != "object")
                                        throw new TypeError(
                                            `${category.categoryId} category option with id ${option.optionId} allowedCheck function need to return {allowed: Boolean, errorMessage: String | null}`
                                        )
                                    canUseList[category.categoryId][
                                        option.optionId
                                    ] = canUse
                                } else {
                                    canUseList[category.categoryId][
                                        option.optionId
                                    ] = {
                                        allowed: true,
                                        errorMessage: null,
                                    }
                                }

                                if (option.optionType !== "spacer") {
                                    if (!actual[category.categoryId]) {
                                        actual[category.categoryId] = {}
                                    }
                                    if (
                                        !actual[category.categoryId][
                                            option.optionId
                                        ]
                                    ) {
                                        actual[category.categoryId][
                                            option.optionId
                                        ] = o.data
                                    }
                                }
                            } else
                                console.log(
                                    `WARNING: Option ${o.optionId} in category ${category.categoryId} doesn't exist in your config.`
                                )
                        }
                    }
                }

            let errors
            let success

            if (req.session.errors) {
                if (String(req.session.errors).includes("%is%")) {
                    errors = req.session.errors.split("%and%")
                }
            }

            if (req.session.success) {
                if (typeof req.session.success == "boolean") {
                    success = true
                } else {
                    if (String(req.session.success).includes("%is%")) {
                        success = req.session.success.split("%and%")
                    }
                }
            }

            req.session.errors = null
            req.session.success = null

            res.render("guild", {
                successes: success,
                errors: errors,
                settings: config.settings,
                actual: actual,
                canUseList,
                bot: config.bot,
                req: req,
                guildid: req.params.id,
                themeConfig: req.themeConfig,
                customThemeOptions: customThemeOptions || {},
                config,
            })
        }
    )

    router.post(
        "/settings/update/:guildId/:categoryId",
        RateFunctions.settingsUpdatePostAPI
            ? RateFunctions.settingsUpdatePostAPI
            : NoRL,
        async (req, res) => {
            if (!req.session.user)
                return res.redirect("/discord?r=/guild/" + req.params.guildId)

            let customThemeOptions
            if (themeConfig?.customThemeOptions?.settingsUpdate) {
                customThemeOptions =
                    await themeConfig.customThemeOptions.settingsUpdate({
                        req: req,
                        config: config,
                        guildId: req.params.id,
                        categoryId: req.params.categoryId,
                    })
            }
            let bot = config.bot

            if (!bot.guilds.cache.get(req.params.guildId))
                return res.redirect("/manage?error=noPermsToManageGuild")
            await bot.guilds.cache
                .get(req.params.guildId)
                .members.fetch(req.session.user.id)
            for (let PermissionRequired of req.requiredPermissions) {
                let converted2 = PermissionRequired[0]
                const DiscordJsVersion2 = Discord.version.split(".")[0]

                if (DiscordJsVersion2 === "14")
                    converted2 = await convert14(PermissionRequired[0])

                if (
                    !bot.guilds.cache
                        .get(req.params.guildId)
                        .members.cache.get(req.session.user.id)
                        .permissions.has(converted2)
                )
                    return res.redirect("/manage?error=noPermsToManageGuild")
            }

            let cid = req.params.categoryId
            let settings = config.settings

            let category = settings.find((c) => c.categoryId == cid)

            if (!category)
                return res.send({
                    error: true,
                    message: "No category found",
                })

            let setNewRes
            let errors = []
            let successes = []
            let catO = []

            const userGuildMemberObject = bot.guilds.cache
                .get(req.params.guildId)
                .members.cache.get(req.session.user.id)
            const guildObject = bot.guilds.cache.get(req.params.guildId)

            for (let option of category.categoryOptionsList) {
                let canUse = {}

                if (option.allowedCheck) {
                    canUse = await option.allowedCheck({
                        guild: { id: req.params.guildId },
                        user: { id: req.session.user.id },
                    })
                } else {
                    canUse = { allowed: true, errorMessage: null }
                }

                if (canUse.allowed == false) {
                    setNewRes = { error: canUse.errorMessage }
                    errors.push(
                        option.optionName +
                            "%is%" +
                            setNewRes.error +
                            "%is%" +
                            option.optionId
                    )
                } else if (option.optionType != "spacer") {
                    if (config.useCategorySet) {
                        if (
                            option.optionType.type == "rolesMultiSelect" ||
                            option.optionType.type == "channelsMultiSelect" ||
                            option.optionType.type == "multiSelect"
                        ) {
                            if (
                                !req.body[option.optionId] ||
                                req.body[option.optionId] == null ||
                                req.body[option.optionId] == undefined
                            )
                                catO.push({
                                    optionId: option.optionId,
                                    data: [],
                                })
                            else if (
                                typeof req.body[option.optionId] != "object"
                            )
                                catO.push({
                                    optionId: option.optionId,
                                    data: [req.body[option.optionId]],
                                })
                            else
                                catO.push({
                                    optionId: option.optionId,
                                    data: req.body[option.optionId],
                                })
                        } else if (option.optionType.type == "switch") {
                            if (
                                req.body[option.optionId] ||
                                req.body[option.optionId] == null ||
                                req.body[option.optionId] == undefined
                            ) {
                                if (
                                    req.body[option.optionId] == null ||
                                    req.body[option.optionId] == undefined
                                )
                                    catO.push({
                                        optionId: option.optionId,
                                        data: false,
                                    })
                                else
                                    catO.push({
                                        optionId: option.optionId,
                                        data: true,
                                    })
                            }
                        } else if (option.optionType.type == "embedBuilder") {
                            if (
                                req.body[option.optionId] == null ||
                                req.body[option.optionId] == undefined
                            )
                                catO.push({
                                    optionId: option.optionId,
                                    data: option.optionType.data,
                                })
                            else {
                                try {
                                    const parsedResponse = JSON.parse(
                                        req.body[option.optionId]
                                    )
                                    catO.push({
                                        optionId: option.optionId,
                                        data: parsedResponse,
                                    })
                                } catch (err) {
                                    catO.push({
                                        optionId: option.optionId,
                                        data: option.optionType.data,
                                    })
                                }
                            }
                        } else {
                            if (
                                req.body[option.optionId] == undefined ||
                                req.body[option.optionId] == null
                            )
                                catO.push({
                                    optionId: option.optionId,
                                    data: null,
                                })
                            else
                                catO.push({
                                    optionId: option.optionId,
                                    data: req.body[option.optionId],
                                })
                        }
                    } else {
                        if (
                            option.optionType.type == "rolesMultiSelect" ||
                            option.optionType.type == "channelsMultiSelect" ||
                            option.optionType.type == "multiSelect"
                        ) {
                            if (
                                !req.body[option.optionId] ||
                                req.body[option.optionId] == null ||
                                req.body[option.optionId] == undefined
                            ) {
                                setNewRes = await option.setNew({
                                    guild: {
                                        id: req.params.guildId,
                                        object: guildObject,
                                    },
                                    user: {
                                        id: req.session.user.id,
                                        object: userGuildMemberObject,
                                    },
                                    newData: [],
                                })
                                setNewRes ? null : (setNewRes = {})
                                if (setNewRes.error) {
                                    errors.push(
                                        option.optionName +
                                            "%is%" +
                                            setNewRes.error +
                                            "%is%" +
                                            option.optionId
                                    )
                                } else {
                                    successes.push(option.optionName)
                                }
                            } else if (
                                typeof req.body[option.optionId] != "object"
                            ) {
                                setNewRes = await option.setNew({
                                    guild: {
                                        id: req.params.guildId,
                                        object: guildObject,
                                    },
                                    user: {
                                        id: req.session.user.id,
                                        object: userGuildMemberObject,
                                    },
                                    newData: [req.body[option.optionId]],
                                })
                                setNewRes ? null : (setNewRes = {})
                                if (setNewRes.error) {
                                    errors.push(
                                        option.optionName +
                                            "%is%" +
                                            setNewRes.error +
                                            "%is%" +
                                            option.optionId
                                    )
                                } else {
                                    successes.push(option.optionName)
                                }
                            } else {
                                setNewRes = await option.setNew({
                                    guild: {
                                        id: req.params.guildId,
                                        object: guildObject,
                                    },
                                    user: {
                                        id: req.session.user.id,
                                        object: userGuildMemberObject,
                                    },
                                    newData: req.body[option.optionId],
                                })
                                setNewRes ? null : (setNewRes = {})
                                if (setNewRes.error) {
                                    errors.push(
                                        option.optionName +
                                            "%is%" +
                                            setNewRes.error +
                                            "%is%" +
                                            option.optionId
                                    )
                                } else {
                                    successes.push(option.optionName)
                                }
                            }
                        } else if (option.optionType.type == "switch") {
                            if (
                                req.body[option.optionId] ||
                                req.body[option.optionId] == null ||
                                req.body[option.optionId] == undefined
                            ) {
                                if (
                                    req.body[option.optionId] == null ||
                                    req.body[option.optionId] == undefined
                                ) {
                                    setNewRes =
                                        (await option.setNew({
                                            guild: {
                                                id: req.params.guildId,
                                                object: guildObject,
                                            },
                                            user: {
                                                id: req.session.user.id,
                                                object: userGuildMemberObject,
                                            },
                                            newData: false,
                                        })) || {}
                                    setNewRes ? null : (setNewRes = {})
                                    if (setNewRes.error) {
                                        errors.push(
                                            option.optionName +
                                                "%is%" +
                                                setNewRes.error +
                                                "%is%" +
                                                option.optionId
                                        )
                                    } else {
                                        successes.push(option.optionName)
                                    }
                                } else {
                                    setNewRes =
                                        (await option.setNew({
                                            guild: {
                                                id: req.params.guildId,
                                                object: guildObject,
                                            },
                                            user: {
                                                id: req.session.user.id,
                                                object: userGuildMemberObject,
                                            },
                                            newData: true,
                                        })) || {}
                                    setNewRes ? null : (setNewRes = {})
                                    if (setNewRes.error) {
                                        errors.push(
                                            option.optionName +
                                                "%is%" +
                                                setNewRes.error +
                                                "%is%" +
                                                option.optionId
                                        )
                                    } else {
                                        successes.push(option.optionName)
                                    }
                                }
                            }
                        } else if (option.optionType.type == "embedBuilder") {
                            if (
                                req.body[option.optionId] == null ||
                                req.body[option.optionId] == undefined
                            ) {
                                setNewRes =
                                    (await option.setNew({
                                        guild: {
                                            id: req.params.guildId,
                                            object: guildObject,
                                        },
                                        user: {
                                            id: req.session.user.id,
                                            object: userGuildMemberObject,
                                        },
                                        newData: option.optionType.data,
                                    })) || {}
                                setNewRes ? null : (setNewRes = {})
                                if (setNewRes.error) {
                                    errors.push(
                                        option.optionName +
                                            "%is%" +
                                            setNewRes.error +
                                            "%is%" +
                                            option.optionId
                                    )
                                } else {
                                    successes.push(option.optionName)
                                }
                            } else {
                                try {
                                    const parsedResponse = JSON.parse(
                                        req.body[option.optionId]
                                    )
                                    setNewRes =
                                        (await option.setNew({
                                            guild: {
                                                id: req.params.guildId,
                                                object: guildObject,
                                            },
                                            user: {
                                                id: req.session.user.id,
                                                object: userGuildMemberObject,
                                            },
                                            newData: parsedResponse,
                                        })) || {}
                                    setNewRes ? null : (setNewRes = {})
                                    if (setNewRes.error) {
                                        errors.push(
                                            option.optionName +
                                                "%is%" +
                                                setNewRes.error +
                                                "%is%" +
                                                option.optionId
                                        )
                                    } else {
                                        successes.push(option.optionName)
                                    }
                                } catch (err) {
                                    setNewRes =
                                        (await option.setNew({
                                            guild: {
                                                id: req.params.guildId,
                                                object: guildObject,
                                            },
                                            user: {
                                                id: req.session.user.id,
                                                object: userGuildMemberObject,
                                            },
                                            newData: option.optionType.data,
                                        })) || {}
                                    setNewRes = {
                                        error: "JSON parse for embed builder went wrong, your settings have been reset.",
                                    }
                                    if (setNewRes.error) {
                                        errors.push(
                                            option.optionName +
                                                "%is%" +
                                                setNewRes.error +
                                                "%is%" +
                                                option.optionId
                                        )
                                    } else {
                                        successes.push(option.optionName)
                                    }
                                }
                            }
                        } else {
                            if (
                                req.body[option.optionId] == undefined ||
                                req.body[option.optionId] == null
                            ) {
                                setNewRes =
                                    (await option.setNew({
                                        guild: {
                                            id: req.params.guildId,
                                            object: guildObject,
                                        },
                                        user: {
                                            id: req.session.user.id,
                                            object: userGuildMemberObject,
                                        },
                                        newData: null,
                                    })) || {}
                                setNewRes ? null : (setNewRes = {})
                                if (setNewRes.error) {
                                    errors.push(
                                        option.optionName +
                                            "%is%" +
                                            setNewRes.error +
                                            "%is%" +
                                            option.optionId
                                    )
                                } else {
                                    successes.push(option.optionName)
                                }
                            } else {
                                setNewRes =
                                    (await option.setNew({
                                        guild: {
                                            id: req.params.guildId,
                                            object: guildObject,
                                        },
                                        user: {
                                            id: req.session.user.id,
                                            object: userGuildMemberObject,
                                        },
                                        newData: req.body[option.optionId],
                                    })) || {}
                                setNewRes ? null : (setNewRes = {})
                                if (setNewRes.error) {
                                    errors.push(
                                        option.optionName +
                                            "%is%" +
                                            setNewRes.error +
                                            "%is%" +
                                            option.optionId
                                    )
                                } else {
                                    successes.push(option.optionName)
                                }
                            }
                        }
                    }
                }
            }

            if (config.useCategorySet && catO.length) {
                let sNR = await category.setNew({
                    guild: {
                        id: req.params.guildId,
                        object: guildObject,
                    },
                    user: {
                        id: req.session.user.id,
                        object: userGuildMemberObject,
                    },
                    data: catO,
                })
                sNR ? null : (sNR = {})
                if (sNR.error) {
                    errors.push(category.categoryId + "%is%" + sNR.error)
                } else {
                    successes.push(category.categoryId)
                }
            }

            let successesForDBDEvent = []
            let errorsForDBDEvent = []

            successes.forEach((item) => {
                if (typeof item == "string") {
                    successesForDBDEvent.push(item.split("%is%"))
                }
            })

            errors.forEach((item) => {
                if (typeof item == "string") {
                    errorsForDBDEvent.push(item.split("%is%"))
                }
            })

            req.DBDEvents.emit("guildSettingsUpdated", {
                user: req.session.user,
                changes: { successesForDBDEvent, errorsForDBDEvent },
            })

            if (errors[0]) {
                if (!successes) successes = []
                req.session.success = successes.join("%and%")
                req.session.errors = errors.join("%and%")
                return res.redirect("/guild/" + req.params.guildId)
            } else {
                req.session.success = true
                req.session.errors = false
                return res.redirect("/guild/" + req.params.guildId)
            }
        }
    )

    return router
}

function convert14(perm) {
    let final = "NULL"

    switch (perm) {
        case "CREATE_INSTANT_INVITE":
            final = "CreateInstantInvite"
            break
        case "KICK_MEMBERS":
            final = "KickMembers"
            break
        case "BAN_MEMBERS":
            final = "BanMembers"
            break
        case "ADMINISTRATOR":
            final = "Administrator"
            break
        case "MANAGE_CHANNELS":
            final = "ManageChannels"
            break
        case "MANAGE_GUILD":
            final = "ManageGuild"
            break
        case "ADD_REACTIONS":
            final = "AddReactions"
            break
        case "VIEW_AUDIT_LOG":
            final = "ViewAuditLog"
            break
        case "PRIORITY_SPEAKER":
            final = "PrioritySpeaker"
            break
        case "STREAM":
            final = "Stream"
            break
        case "VIEW_CHANNEL":
            final = "ViewChannel"
            break
        case "SEND_MESSAGES":
            final = "SendMessages"
            break
        case "SEND_TTS_MESSAGES":
            final = "SendTTSMessages"
            break
        case "MANAGE_MESSAGES":
            final = "ManageMessages"
            break
        case "EMBED_LINKS":
            final = "ManageMessages"
            break
        case "ATTACH_FILES":
            final = "AttachFiles"
            break
        case "READ_MESSAGE_HISTORY":
            final = "ReadMessageHistory"
            break
        case "MENTION_EVERYONE":
            final = "MentionEveryone"
            break
        case "USE_EXTERNAL_EMOJIS":
            final = "UseExternalEmojis"
            break
        case "VIEW_GUILD_INSIGHTS":
            final = "ViewGuildInsughts"
            break
        case "CONNECT":
            final = "Connect"
            break
        case "SPEAK":
            final = "Speak"
            break
    }

    return final
}
