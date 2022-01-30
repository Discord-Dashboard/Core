const Discord = require("discord.js");
const router = require('express').Router();

module.exports = (app, config, themeConfig) => {
    router.get('/manage', async (req, res) => {
        if (!req.session.user) return res.redirect('/discord?r=/manage');
        let customThemeOptions;
        if(themeConfig.customThemeOptions){
            customThemeOptions = await themeConfig.customThemeOptions.manage({req: req,res:res,config:config});
        }
        res.render('guilds', {
            req: req,
            bot: config.bot,
            themeConfig: req.themeConfig,
            customThemeOptions: customThemeOptions || {}
        });
    });

    router.get('/guild/:id', async (req, res) => {
        if (!req.session.user) return res.redirect('/discord?r=/guild/' + req.params.id);
        let customThemeOptions;
        if(themeConfig.customThemeOptions) {
            customThemeOptions = await themeConfig.customThemeOptions.getGuild({req: req, res: res, config: config,guildId: req.params.id});
        }
        let bot = config.bot;
        if(!bot.guilds.cache.get(req.params.id)){
            try{
                await bot.guilds.fetch(req.params.id);
            }catch(err){}
        };
        if (!bot.guilds.cache.get(req.params.id)) return res.redirect('/manage?error=noPermsToManageGuild');
        if(!bot.guilds.cache.get(req.params.id).members.cache.get(req.session.user.id)) {
            try{
                await bot.guilds.cache.get(req.params.id).members.fetch(req.session.user.id);
            }catch(err){}
        }
        for(let PermissionRequired of req.requiredPermissions){
            if (!bot.guilds.cache.get(req.params.id).members.cache.get(req.session.user.id).permissions.has(PermissionRequired[0])) return res.redirect('/manage?error=noPermsToManageGuild');
        }

        if(bot.guilds.cache.get(req.params.id).channels.cache.size < 1){
            try{
                await bot.guilds.cache.get(req.params.id).channels.fetch();
            }catch(err){}
        }

        if(bot.guilds.cache.get(req.params.id).roles.cache.size < 2){
            try{
                await bot.guilds.cache.get(req.params.id).roles.fetch();
            }catch(err){}
        }

        let actual = {};

        let canUseList = {};
        for (const s of config.settings) {
            if(!canUseList[s.categoryId])canUseList[s.categoryId] = {};
            for (const c of s.categoryOptionsList) {
                if(c.allowedCheck){
                    const canUse = await c.allowedCheck({guild:{id:req.params.id}, user: {id: req.session.user.id}});
                    if(typeof(canUse) != 'object')throw new TypeError(`${s.categoryId} category option with id ${c.optionId} allowedCheck function need to return {allowed: Boolean, errorMessage: String | null}`);
                    canUseList[s.categoryId][c.optionId] = canUse;
                }else{
                    canUseList[s.categoryId][c.optionId] = {allowed: true, errorMessage: null};
                }

                if (c.optionType == 'spacer') {} else {
                    if (!actual[s.categoryId]) {
                        actual[s.categoryId] = {};
                    }
                    if (!actual[s.categoryId][c.optionId]) {
                        actual[s.categoryId][c.optionId] = await c.getActualSet({
                            guild: {
                                id: req.params.id
                            }
                        });
                    }
                }
            }
        }

        let errors = null;
        let success = null;

        if (req.query.error) {
            if (!success) success = [];
            errors = req.query.error.split('%and%');
        }

        if (req.query.success) {
            success = req.query.success.split('%and%');
        }

        res.render('guild', {
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
            config
        });
    });

    router.post('/settings/update/:guildId/:categoryId', async (req, res) => {
        if (!req.session.user) return res.redirect('/discord?r=/guild/' + req.params.guildId);
        let customThemeOptions;
        if(themeConfig.customThemeOptions) {
            customThemeOptions = await themeConfig.customThemeOptions.settingsUpdate({req: req, config: config,guildId: req.params.id,categoryId:req.params.categoryId});
        }
        let bot = config.bot;
        if (!bot.guilds.cache.get(req.params.guildId)) return res.redirect('/manage?error=noPermsToManageGuild');
        await bot.guilds.cache.get(req.params.guildId).members.fetch(req.session.user.id);
        for(let PermissionRequired of req.requiredPermissions){
            if (!bot.guilds.cache.get(req.params.guildId).members.cache.get(req.session.user.id).permissions.has(PermissionRequired[0])) return res.redirect('/manage?error=noPermsToManageGuild');
        }
        let cid = req.params.categoryId;
        let settings = config.settings;

        let category = settings.find(c => c.categoryId == cid);

        if (!category) return res.send({
            error: true,
            message: "No category found"
        });

        let setNewRes;
        let errors = [];
        let successes = [];

        for (let option of category.categoryOptionsList) {
            let canUse = {};

            if(option.allowedCheck){
                canUse = await option.allowedCheck({guild:{id:req.params.guildId}, user: {id: req.session.user.id}});
            }else{
                canUse = {allowed: true, errorMessage: null};
            }

            if(canUse.allowed == false){
                setNewRes = {error: canUse.errorMessage}
                errors.push(option.optionName + '%is%' + setNewRes.error + '%is%' + option.optionId);
            }else{
                if (option.optionType == "spacer") {

                } else if (option.optionType.type == "rolesMultiSelect" || option.optionType.type == 'channelsMultiSelect' || option.optionType.type == 'multiSelect') {
                    if (!req.body[option.optionId] || req.body[option.optionId] == null || req.body[option.optionId] == undefined) {
                        setNewRes = await option.setNew({
                            guild: {
                                id: req.params.guildId
                            },
                            user: {
                                id: req.session.user.id
                            },
                            newData: []
                        });
                        setNewRes ? null : setNewRes = {};
                        if (setNewRes.error) {
                            errors.push(option.optionName + '%is%' + setNewRes.error + '%is%' + option.optionId);
                        } else {
                            successes.push(option.optionName);
                        }
                    } else if (typeof(req.body[option.optionId]) != 'object') {
                        setNewRes = await option.setNew({
                            guild: {
                                id: req.params.guildId
                            },
                            user: {
                                id: req.session.user.id
                            },
                            newData: [req.body[option.optionId]]
                        });
                        setNewRes ? null : setNewRes = {};
                        if (setNewRes.error) {
                            errors.push(option.optionName + '%is%' + setNewRes.error + '%is%' + option.optionId);
                        } else {
                            successes.push(option.optionName);
                        }
                    } else {
                        setNewRes = await option.setNew({
                            guild: {
                                id: req.params.guildId
                            },
                            user: {
                                id: req.session.user.id
                            },
                            newData: req.body[option.optionId]
                        });
                        setNewRes ? null : setNewRes = {};
                        if (setNewRes.error) {
                            errors.push(option.optionName + '%is%' + setNewRes.error + '%is%' + option.optionId);
                        } else {
                            successes.push(option.optionName);
                        }
                    }
                } else if (option.optionType.type == "switch") {
                    if (req.body[option.optionId] || req.body[option.optionId] == null || req.body[option.optionId] == undefined) {
                        if (req.body[option.optionId] == null || req.body[option.optionId] == undefined) {
                            setNewRes = await option.setNew({
                                guild: {
                                    id: req.params.guildId
                                },
                                user: {
                                    id: req.session.user.id
                                },
                                newData: false
                            }) || {};
                            setNewRes ? null : setNewRes = {};
                            if (setNewRes.error) {
                                errors.push(option.optionName + '%is%' + setNewRes.error + '%is%' + option.optionId);
                            } else {
                                successes.push(option.optionName);
                            }
                        } else {
                            setNewRes = await option.setNew({
                                guild: {
                                    id: req.params.guildId
                                },
                                user: {
                                    id: req.session.user.id
                                },
                                newData: true
                            }) || {};
                            setNewRes ? null : setNewRes = {};
                            if (setNewRes.error) {
                                errors.push(option.optionName + '%is%' + setNewRes.error + '%is%' + option.optionId);
                            } else {
                                successes.push(option.optionName);
                            }
                        }
                    }
                } else if (option.optionType.type == "embedBuilder") {
                    if (req.body[option.optionId] == null || req.body[option.optionId] == undefined) {
                        setNewRes = await option.setNew({
                            guild: {
                                id: req.params.guildId
                            },
                            user: {
                                id: req.session.user.id
                            },
                            newData: option.optionType.data
                        }) || {};
                        setNewRes ? null : setNewRes = {};
                        if (setNewRes.error) {
                            errors.push(option.optionName + '%is%' + setNewRes.error + '%is%' + option.optionId);
                        } else {
                            successes.push(option.optionName);
                        }
                    }else{
                        try{
                            const parsedResponse = JSON.parse(req.body[option.optionId]);
                            setNewRes = await option.setNew({
                                guild: {
                                    id: req.params.guildId
                                },
                                user: {
                                    id: req.session.user.id
                                },
                                newData: parsedResponse
                            }) || {};
                            setNewRes ? null : setNewRes = {};
                            if (setNewRes.error) {
                                errors.push(option.optionName + '%is%' + setNewRes.error + '%is%' + option.optionId);
                            } else {
                                successes.push(option.optionName);
                            }
                        }catch(err){
                            setNewRes = await option.setNew({
                                guild: {
                                    id: req.params.guildId
                                },
                                user: {
                                    id: req.session.user.id
                                },
                                newData: option.optionType.data
                            }) || {};
                            setNewRes = {error: 'JSON parse for embed builder went wrong, your settings have been reset.'}
                            if (setNewRes.error) {
                                errors.push(option.optionName + '%is%' + setNewRes.error + '%is%' + option.optionId);
                            } else {
                                successes.push(option.optionName);
                            }
                        }
                    }
                } else {
                    if (req.body[option.optionId] == undefined || req.body[option.optionId] == null) {
                        setNewRes = await option.setNew({
                            guild: {
                                id: req.params.guildId
                            },
                            user: {
                                id: req.session.user.id
                            },
                            newData: null
                        }) || {};
                        setNewRes ? null : setNewRes = {};
                        if (setNewRes.error) {
                            errors.push(option.optionName + '%is%' + setNewRes.error + '%is%' + option.optionId);
                        } else {
                            successes.push(option.optionName);
                        }
                    } else {
                        setNewRes = await option.setNew({
                            guild: {
                                id: req.params.guildId
                            },
                            user: {
                                id: req.session.user.id
                            },
                            newData: req.body[option.optionId]
                        }) || {};
                        setNewRes ? null : setNewRes = {};
                        if (setNewRes.error) {
                            errors.push(option.optionName + '%is%' + setNewRes.error + '%is%' + option.optionId);
                        } else {
                            successes.push(option.optionName);
                        }
                    }
                }
            }
        }

        let successesForDBDEvent = [];
        let errorsForDBDEvent = [];

        successes.forEach(item=>{
           successesForDBDEvent.push(item.split('%is%')) ;
        });

        errors.forEach(item=>{
            errorsForDBDEvent.push(item.split('%is%')) ;
        });

        req.DBDEvents.emit('guildSettingsUpdated', {user: req.session.user, changes: {successesForDBDEvent, errorsForDBDEvent}});

        if (errors[0]) {
            if (!successes) successes = [];
            return res.redirect('/guild/' + req.params.guildId + `?success=${successes.join('%and%')}&error=${errors.join('%and%')}`)
        } else {
            return res.redirect('/guild/' + req.params.guildId + '?success=true&error=false');
        }
    });

    return router;
}
