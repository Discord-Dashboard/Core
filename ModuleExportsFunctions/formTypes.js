const discordPermissions = require("./discordPermissions")

module.exports = {
    select: (list, disabled, themeOptions = {}) => {
        if (!list)
            throw new Error(
                err("List in the 'select' form type cannot be empty.")
            )
        if (typeof list != "object")
            throw new Error(
                err("List in the 'select' form type should be an JSON object.")
            )
        let keys = Object.keys(list)
        let values = Object.values(list)
        return {
            type: "select",
            data: {
                keys,
                values,
            },
            disabled: disabled || false,
            themeOptions,
        }
    },
    multiSelect: (list, disabled, required, themeOptions = {}) => {
        if (!list)
            throw new Error(
                err("List in the 'select' form type cannot be empty.")
            )
        if (typeof list != "object")
            throw new Error(
                err("List in the 'select' form type should be an JSON object.")
            )
        let keys = Object.keys(list)
        let values = Object.values(list)
        return {
            type: "multiSelect",
            data: {
                keys,
                values,
            },
            disabled: disabled || false,
            required: required || false,
            themeOptions,
        }
    },
    input: (placeholder, min, max, disabled, required, themeOptions = {}) => {
        if (min) {
            if (isNaN(min))
                throw new Error(
                    err("'min' in the 'input' form type should be an number.")
                )
        }
        if (max) {
            if (isNaN(max))
                throw new Error(
                    err("'max' in the 'input' form type should be an number.")
                )
        }
        if (min && max) {
            if (min > max)
                throw new Error(
                    err(
                        "'min' in the 'input' form type cannot be higher than 'max'."
                    )
                )
        }
        return {
            type: "input",
            data: placeholder,
            min: min || null,
            max: max || null,
            disabled: disabled || false,
            required: required || false,
            themeOptions,
        }
    },
    textarea: (
        placeholder,
        min,
        max,
        disabled,
        required,
        themeOptions = {}
    ) => {
        if (min) {
            if (isNaN(min))
                throw new Error(
                    err("'min' in the 'input' form type should be an number.")
                )
        }
        if (max) {
            if (isNaN(max))
                throw new Error(
                    err("'max' in the 'input' form type should be an number.")
                )
        }
        if (min && max) {
            if (min > max)
                throw new Error(
                    err(
                        "'min' in the 'input' form type cannot be higher than 'max'."
                    )
                )
        }
        return {
            type: "textarea",
            data: placeholder,
            min: min || null,
            max: max || null,
            disabled: disabled || false,
            required: required || false,
            themeOptions,
        }
    },
    switch: (disabled, themeOptions = {}) => {
        return {
            type: "switch",
            disabled: disabled,
            themeOptions,
        }
    },
    checkbox: (disabled, themeOptions = {}) => {
        return {
            type: "checkbox",
            disabled: disabled,
            themeOptions,
        }
    },
    channelsSelect: (
        disabled,
        channelTypes = ["GUILD_TEXT"],
        hideNSFW,
        onlyNSFW,
        themeOptions = {}
    ) => {
        return {
            type: "channelsSelect",
            function: (client, guildid) => {
                let listCount = {}
                let list = {
                    "-": "",
                }
                client.guilds.cache
                    .get(guildid)
                    .channels.cache.forEach((channel) => {
                        if (!channelTypes.includes(channel.type)) return
                        if (hideNSFW && channel.nsfw) return
                        if (onlyNSFW && !channel.nsfw) return
                        listCount[channel.name]
                            ? (listCount[channel.name] =
                                  listCount[channel.name] + 1)
                            : (listCount[channel.name] = 1)
                        if (list[channel.name])
                            list[
                                `${channel.name} (${listCount[channel.name]})`
                            ] = channel.id
                        else list[channel.name] = channel.id
                    })

                let myObj = list
                let keys = Object.keys(myObj),
                    i = null,
                    len = keys.length

                keys.sort()
                list = {}

                for (i = 0; i < len; i++) {
                    k = keys[i]
                    list[k] = myObj[k]
                }

                return {
                    values: Object.values(list),
                    keys: Object.keys(list),
                }
            },
            disabled,
            themeOptions,
        }
    },
    channelsMultiSelect: (
        disabled,
        required,
        channelTypes = ["GUILD_TEXT"],
        hideNSFW,
        onlyNSFW,
        themeOptions = {}
    ) => {
        return {
            type: "channelsMultiSelect",
            function: (client, guildid) => {
                let listCount = {}
                let list = {
                    "-": "",
                }
                client.guilds.cache
                    .get(guildid)
                    .channels.cache.forEach((channel) => {
                        if (!channelTypes.includes(channel.type)) return
                        if (hideNSFW && channel.nsfw) return
                        if (onlyNSFW && !channel.nsfw) return
                        listCount[channel.name]
                            ? (listCount[channel.name] =
                                  listCount[channel.name] + 1)
                            : (listCount[channel.name] = 1)
                        if (list[channel.name])
                            list[
                                `${channel.name} (${listCount[channel.name]})`
                            ] = channel.id
                        else list[channel.name] = channel.id
                    })

                let myObj = list
                let keys = Object.keys(myObj),
                    i = null,
                    len = keys.length

                keys.sort()
                list = {}

                for (i = 0; i < len; i++) {
                    k = keys[i]
                    list[k] = myObj[k]
                }

                return {
                    values: Object.values(list),
                    keys: Object.keys(list),
                }
            },
            disabled,
            required,
            themeOptions,
        }
    },
    rolesMultiSelect: (disabled, required, includeBots, themeOptions = {}) => {
        return {
            type: "rolesMultiSelect",
            function: (client, guildid) => {
                let listCount = {}
                let list = {
                    "-": "",
                }
                client.guilds.cache.get(guildid).roles.cache.forEach((role) => {
                    if (role.managed && !includeBots) return
                    listCount[role.name]
                        ? (listCount[role.name] = listCount[role.name] + 1)
                        : (listCount[role.name] = 1)
                    if (list[role.name])
                        list[`${role.name} (${listCount[role.name]})`] = role.id
                    else list[role.name] = role.id
                })

                let myObj = list
                let keys = Object.keys(myObj),
                    i = null,
                    len = keys.length

                keys.sort()
                list = {}

                for (i = 0; i < len; i++) {
                    k = keys[i]
                    list[k] = myObj[k]
                }

                return {
                    values: Object.values(list),
                    keys: Object.keys(list),
                }
            },
            disabled,
            required,
            themeOptions,
        }
    },
    rolesSelect: (disabled, includeBots, themeOptions = {}) => {
        return {
            type: "rolesSelect",
            function: (client, guildid) => {
                let listCount = {}
                let list = {
                    "-": "",
                }
                client.guilds.cache.get(guildid).roles.cache.forEach((role) => {
                    if (role.managed && !includeBots) return

                    if (role.id === guildid) return // @everyone role
                    listCount[role.name]
                        ? (listCount[role.name] = listCount[role.name] + 1)
                        : (listCount[role.name] = 1)
                    if (list[role.name])
                        list[`${role.name} (${listCount[role.name]})`] = role.id
                    else list[role.name] = role.id
                })

                let myObj = list
                let keys = Object.keys(myObj),
                    i = null,
                    len = keys.length

                keys.sort()
                list = {}

                for (i = 0; i < len; i++) {
                    k = keys[i]
                    list[k] = myObj[k]
                }

                return {
                    values: Object.values(list),
                    keys: Object.keys(list),
                }
            },
            disabled,
            themeOptions,
        }
    },
    colorSelect: (defaultState, disabled, themeOptions = {}) => {
        return {
            type: "colorSelect",
            data: defaultState,
            disabled,
            themeOptions,
        }
    },
    embedBuilder: (defaultSettings, disabled, themeOptions = {}) => {
        return {
            type: "embedBuilder",
            data: defaultSettings,
            disabled,
            themeOptions,
        }
    },
}
