module.exports = {
    select: (list, disabled) => {
        if (!list) throw new Error(err("List in the 'select' form type cannot be empty."));
        if (typeof(list) != "object") throw new Error(err("List in the 'select' form type should be an JSON object."));
        let keys = Object.keys(list);
        let values = Object.values(list);
        return {
            type: "select",
            data: {
                keys,
                values
            },
            disabled: disabled || false
        };
    },
    multiSelect: (list, disabled, required) => {
        if (!list) throw new Error(err("List in the 'select' form type cannot be empty."));
        if (typeof(list) != "object") throw new Error(err("List in the 'select' form type should be an JSON object."));
        let keys = Object.keys(list);
        let values = Object.values(list);
        return {
            type: "multiSelect",
            data: {
                keys,
                values
            },
            disabled: disabled || false,
            required: required || false
        };
    },
    input: (placeholder, min, max, disabled, required, useEmojiPicker=true) => {
        if (min) {
            if (isNaN(min)) throw new Error(err("'min' in the 'input' form type should be an number."));
        }
        if (max) {
            if (isNaN(max)) throw new Error(err("'max' in the 'input' form type should be an number."));
        }
        if (min && max) {
            if (min > max) throw new Error(err("'min' in the 'input' form type cannot be higher than 'max'."));
        }
        return {
            type: "input",
            data: placeholder,
            min: min || null,
            max: max || null,
            disabled: disabled || false,
            required: required || false,
            useEmojiPicker
        };
    },
    textarea: (placeholder, min, max, disabled, required) => {
        if (min) {
            if (isNaN(min)) throw new Error(err("'min' in the 'input' form type should be an number."));
        }
        if (max) {
            if (isNaN(max)) throw new Error(err("'max' in the 'input' form type should be an number."));
        }
        if (min && max) {
            if (min > max) throw new Error(err("'min' in the 'input' form type cannot be higher than 'max'."));
        }
        return {
            type: "textarea",
            data: placeholder,
            min: min || null,
            max: max || null,
            disabled: disabled || false,
            required: required || false
        };
    },
    switch: (disabled) => {
        return {
            type: "switch",
            disabled: disabled
        };
    },
    checkbox: (disabled) => {
        return {
            type: "checkbox",
            disabled: disabled
        };
    },
    channelsSelect: (disabled, channelTypes = ['GUILD_TEXT']) => {
        return {
            type: "channelsSelect",
            function: (client, guildid) => {
                let listCount = {};
                let list = {
                    '-': ''
                };
                if(client.guilds.cache.size <= 1) client.guilds.resolve(guildid).then(g => g.channels.fetch())
                client.guilds.cache.get(guildid).channels.cache.forEach(channel => {
                    if (!channelTypes.includes(channel.type)) return;
                    listCount[channel.name] ? listCount[channel.name] = listCount[channel.name] + 1 : listCount[channel.name] = 1;
                    if (list[channel.name]) list[`${channel.name} (${listCount[channel.name]})`] = channel.id;
                    else list[channel.name] = channel.id;
                });

                let myObj = list;
                let keys = Object.keys(myObj),
                    i = null,
                    len = keys.length;

                keys.sort();
                list = {};

                for (i = 0; i < len; i++) {
                    k = keys[i];
                    list[k] = myObj[k];
                }

                return {
                    values: Object.values(list),
                    keys: Object.keys(list)
                };
            },
            disabled
        };
    },
    channelsMultiSelect: (disabled, required, channelTypes = ['GUILD_TEXT']) => {
        return {
            type: "channelsMultiSelect",
            function: (client, guildid) => {
                let listCount = {};
                let list = {
                    '-': ''
                };
                if(client.guilds.cache.size <= 1) client.guilds.resolve(guildid).then(g => g.channels.fetch())
                client.guilds.cache.get(guildid).channels.cache.forEach(channel => {
                    if (!channelTypes.includes(channel.type)) return;
                    listCount[channel.name] ? listCount[channel.name] = listCount[channel.name] + 1 : listCount[channel.name] = 1;
                    if (list[channel.name]) list[`${channel.name} (${listCount[channel.name]})`] = channel.id;
                    else list[channel.name] = channel.id;
                });

                let myObj = list;
                let keys = Object.keys(myObj),
                    i = null,
                    len = keys.length;

                keys.sort();
                list = {};

                for (i = 0; i < len; i++) {
                    k = keys[i];
                    list[k] = myObj[k];
                }

                return {
                    values: Object.values(list),
                    keys: Object.keys(list)
                };
            },
            disabled,
            required
        };
    },
    rolesMultiSelect: (disabled, required) => {
        return {
            type: "rolesMultiSelect",
            function: (client, guildid) => {
                let listCount = {};
                let list = {
                    '-': ''
                };
                if(client.guilds.cache.size <= 1) client.guilds.resolve(guildid).then(g => g.roles.fetch());
                client.guilds.cache.get(guildid).roles.cache.forEach(role => {
                    if (role.managed) return;
                    listCount[role.name] ? listCount[role.name] = listCount[role.name] + 1 : listCount[role.name] = 1;
                    if (list[role.name]) list[`${role.name} (${listCount[role.name]})`] = role.id;
                    else list[role.name] = role.id;
                });

                let myObj = list;
                let keys = Object.keys(myObj),
                    i = null,
                    len = keys.length;

                keys.sort();
                list = {};

                for (i = 0; i < len; i++) {
                    k = keys[i];
                    list[k] = myObj[k];
                }

                return {
                    values: Object.values(list),
                    keys: Object.keys(list)
                };
            },
            disabled,
            required
        };
    },
    rolesSelect: (disabled) => {
        return {
            type: "rolesSelect",
            function: (client, guildid) => {
                let listCount = {};
                let list = {
                    '-': ''
                };
                if(client.guilds.cache.size <= 1) client.guilds.resolve(guildid).then(g => g.roles.fetch());
                client.guilds.cache.get(guildid).roles.cache.forEach(role => {
                    if (role.managed) return;

                    if (role.id === guildid) return; // @everyone role
                    listCount[role.name] ? listCount[role.name] = listCount[role.name] + 1 : listCount[role.name] = 1;
                    if (list[role.name]) list[`${role.name} (${listCount[role.name]})`] = role.id;
                    else list[role.name] = role.id;
                });

                let myObj = list;
                let keys = Object.keys(myObj),
                    i = null,
                    len = keys.length;

                keys.sort();
                list = {};

                for (i = 0; i < len; i++) {
                    k = keys[i];
                    list[k] = myObj[k];
                }

                return {
                    values: Object.values(list),
                    keys: Object.keys(list)
                };
            },
            disabled
        };
    },
    colorSelect: (defaultState, disabled) => {
        return {
            type: "colorSelect",
            data: defaultState,
            disabled
        };
    }
}
