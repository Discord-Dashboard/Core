const colors = require('colors');

const err = (text) => {
    return text + ` Do you need help? Join our Discord server: ${'https://discord.gg/CzfMGtrdaA'.blue}`;
}

class Dashboard {
    constructor(config) {
        let notSetYetAndRequired = [];
        if(!config.port)notSetYetAndRequired.push('port');
        if(!config.theme)notSetYetAndRequired.push('theme');
        if(!config.client)notSetYetAndRequired.push('client');
        if(!config.redirectUri)notSetYetAndRequired.push('redirectUri');
        if(!config.bot)notSetYetAndRequired.push('bot');
        if(!config.settings)notSetYetAndRequired.push('settings');
        if(!config.domain)notSetYetAndRequired.push('domain');
        if(notSetYetAndRequired[0])throw new Error(err(`You need to define some more things: ${notSetYetAndRequired.join(', ')}.`));
        this.config = config;
    }

    init() {
        const config = this.config;
        const express = require('express');
        const app = express();


        const session = require('express-session');
        const FileStore = require('session-file-store')(session);
        const bodyParser = require('body-parser');
        const partials = require('express-partials');

        let v13support = false;

        const Discord = require('discord.js');
        if(Discord.version.slice(0,2) == "13")v13support = true;

        app.use(bodyParser.urlencoded({extended : true}));
        app.use(bodyParser.json());
        app.use(partials());

        if(config.theme){
            app.set('views', config.theme.viewsPath);
            app.use(express.static(config.theme.staticPath));
            app.use('/', express.static(config.theme.staticPath));
            app.use('/:a/', express.static(config.theme.staticPath));
            app.use('/:a/:b/', express.static(config.theme.staticPath));
            app.use('/:a/:b/:c/', express.static(config.theme.staticPath));
            app.use('/:a/:b/:c/:d/', express.static(config.theme.staticPath));
        }
        app.set('view engine','ejs');

        let sessionIs;

        if(!config.sessionFileStore)config.sessionFileStore = false;

        if(config.sessionFileStore){
            sessionIs = session({
                secret: config.cookiesSecret || 'total_secret_cookie_secret',
                resave: true,
                saveUninitialized: true,
                cookie: {
                    expires: new Date(253402300799999),
                    maxAge: 253402300799999,
                },
                store: new FileStore
            });
        }else{
            sessionIs = session({
                secret: config.cookiesSecret || 'total_secret_cookie_secret',
                resave: true,
                saveUninitialized: true,
                cookie: {
                    expires: new Date(253402300799999),
                    maxAge: 253402300799999,
                },
            });
        }

        app.use(sessionIs);

        if(config.useUnderMaintenance){
            app.get(config.underMaintenanceAccessPage || '/total-secret-get-access', (req,res)=>{
               res.send(`
               <form action="${config.domain}${config.underMaintenanceAccessPage || '/total-secret-get-access'}" method="POST" >
                    <input id="accessKey" name="accessKey"/>
                    <button role="submit">Submit</button>
               </form>
               `)
            });

            app.post(config.underMaintenanceAccessPage || '/total-secret-get-access', (req,res)=>{
                if(!req.body)req.body = {};
                const accessKey = req.body.accessKey;
                if(accessKey != config.underMaintenanceAccessKey)return res.send('Wrong key.');
                req.session.umaccess = true;
                res.redirect('/');
            });

            app.use((req,res,next)=>{
                if(!req.session.umaccess)return res.send(config.underMaintenanceCustomHtml || require('./underMaintenancePageDefault')(config.underMaintenance));
                else next();
            })
        }

        let themeConfig = {};
        if(config.theme)themeConfig = config.theme.themeConfig;

        if(!config.invite)config.invite = {};

        app.use((req,res,next)=>{
            if(!req.body)req.body={};

            req.client = config.client;
            req.redirectUri = config.redirectUri;

            req.themeConfig = themeConfig;

            req.botToken = config.bot.token;
            req.guildAfterAuthorization = config.guildAfterAuthorization || {};

            req.websiteTitle = config.websiteTitle || "Discord Web Dashboard";
            req.iconUrl = config.iconUrl || 'https://www.nomadfoods.com/wp-content/uploads/2018/08/placeholder-1-e1533569576673.png';
            next();
        });

        require('./router')(app);

        app.get('/', (req,res) => {
            res.render('index', {req:req,themeConfig:req.themeConfig,bot:config.bot});
        });

        app.get('/invite', (req,res) => {
            const scopes = config.invite.scopes || ["bot"];
            res.redirect(`https://discord.com/oauth2/authorize?client_id=${config.invite.clientId || config.bot.user.id}&scope=${scopes.join('%20')}&permissions=${config.invite.permissions || '0'}${config.invite.redirectUri ? `&response_type=code&redirect_uri=${config.invite.redirectUri}` : ''}${config.invite.otherParams || ''}`);
        });

        app.get('/manage', (req,res) => {
            if(!req.session.user)return res.redirect('/discord?r=/manage');
            res.render('guilds', {req:req,bot:config.bot,themeConfig:req.themeConfig});
        });

        app.get('/guild/:id', async (req,res)=>{
            if(!req.session.user)return res.redirect('/discord?r=/guild/' + req.params.id);
            let bot = config.bot;
            if(!bot.guilds.cache.get(req.params.id))return res.redirect('/manage?error=noPermsToManageGuild');
            await bot.guilds.cache.get(req.params.id).members.fetch(req.session.user.id);
            if(v13support){
                if (!bot.guilds.cache.get(req.params.id).members.cache.get(req.session.user.id).permissions.has(Discord.Permissions.FLAGS.MANAGE_GUILD))return res.redirect('/manage?error=noPermsToManageGuild');
            }else{
                if (!bot.guilds.cache.get(req.params.id).members.cache.get(req.session.user.id).hasPermission('MANAGE_GUILD'))return res.redirect('/manage?error=noPermsToManageGuild');
            }
            let actual = {};
            for(const s of config.settings){
                for(const c of s.categoryOptionsList){
                    if(!actual[s.categoryId]){
                        actual[s.categoryId] = {};
                    }
                    if(!actual[s.categoryId][c.optionId]){
                        actual[s.categoryId][c.optionId] = await c.getActualSet({guild:{id:req.params.id}});
                    }
                }
            }

            let errors = null;
            let success = null;

            if(req.query.error){
                if(!success)success=[];
                errors = req.query.error.split('%and%');
            }

            if(req.query.success){
                success = req.query.success.split('%and%');
            }

            res.render('guild', {successes:success,errors:errors,settings:config.settings,actual:actual,bot:config.bot,req:req,guildid:req.params.id,themeConfig:req.themeConfig});
        });

        app.post('/settings/update/:guildId/:categoryId', async (req,res)=>{
            if(!req.session.user)return res.redirect('/discord?r=/guild/' + req.params.guildId);
            let bot = config.bot;
            if(!bot.guilds.cache.get(req.params.guildId))return res.redirect('/manage?error=noPermsToManageGuild');
            await bot.guilds.cache.get(req.params.guildId).members.fetch(req.session.user.id);
            if(v13support){
                if (!bot.guilds.cache.get(req.params.guildId).members.cache.get(req.session.user.id).permissions.has(Discord.Permissions.FLAGS.MANAGE_GUILD))return res.redirect('/manage?error=noPermsToManageGuild');
            }else{
                if (!bot.guilds.cache.get(req.params.guildId).members.cache.get(req.session.user.id).hasPermission('MANAGE_GUILD'))return res.redirect('/manage?error=noPermsToManageGuild');
            }

            let cid = req.params.categoryId;
            let settings = config.settings;

            let category = settings.find(c=>c.categoryId == cid);

            if(!category)return res.send({error:true,message:"No category found"});

            let setNewRes;
            let errors=[];
            let successes=[];

            for (let option of category.categoryOptionsList){
                if(option.optionType.type == "rolesMultiSelect" || option.optionType.type == 'channelsMultiSelect' || option.optionType.type == 'multiSelect'){
                    if(!req.body[option.optionId] || req.body[option.optionId] == null || req.body[option.optionId] == undefined) {
                        setNewRes = await option.setNew({guild:{id:req.params.guildId},user:{id:req.session.user.id},newData:[]});
                        setNewRes ? null : setNewRes = {};
                        if(setNewRes.error) {
                            errors.push(option.optionName + '%is%' + setNewRes.error + '%is%' + option.optionId);
                        }else {
                            successes.push(option.optionName);
                        }
                    }else if(typeof(req.body[option.optionId]) != 'object') {
                        setNewRes = await option.setNew({guild:{id:req.params.guildId},user:{id:req.session.user.id},newData:[req.body[option.optionId]]});
                        setNewRes ? null : setNewRes = {};
                        if(setNewRes.error) {
                            errors.push(option.optionName + '%is%' + setNewRes.error + '%is%' + option.optionId);
                        }else {
                            successes.push(option.optionName);
                        }
                    } else{
                        setNewRes = await option.setNew({guild:{id:req.params.guildId},user:{id:req.session.user.id},newData:req.body[option.optionId]});
                        setNewRes ? null : setNewRes = {};
                        if(setNewRes.error) {
                            errors.push(option.optionName + '%is%' + setNewRes.error + '%is%' + option.optionId);
                        }else {
                            successes.push(option.optionName);
                        }
                    }
                }else  if(option.optionType.type == "switch"){
                    if(!req.body[option.optionId] || req.body[option.optionId] == null || req.body[option.optionId] == undefined){
                        if(req.body[option.optionId] == null || req.body[option.optionId] == undefined){
                            setNewRes = await option.setNew({guild:{id:req.params.guildId},user:{id:req.session.user.id},newData:false}) || {};
                            setNewRes ? null : setNewRes = {};
                            if(setNewRes.error) {
                                errors.push(option.optionName + '%is%' + setNewRes.error + '%is%' + option.optionId);
                            }else {
                                successes.push(option.optionName);
                            }
                        }else{
                            setNewRes = await option.setNew({guild:{id:req.params.guildId},user:{id:req.session.user.id},newData:true}) || {};
                            setNewRes ? null : setNewRes = {};
                            if(setNewRes.error) {
                                    errors.push(option.optionName + '%is%' + setNewRes.error + '%is%' + option.optionId);
                                }else {
                                    successes.push(option.optionName);
                                }
                            }
                        }
                }else{
                    if(req.body[option.optionId] == undefined || req.body[option.optionId] == null){
                        setNewRes = await option.setNew({guild:{id:req.params.guildId},user:{id:req.session.user.id},newData:null}) || {};
                        setNewRes ? null : setNewRes = {};
                        if(setNewRes.error) {
                            errors.push(option.optionName + '%is%' + setNewRes.error + '%is%' + option.optionId);
                        }else {
                            successes.push(option.optionName);
                        }
                    }else{
                        setNewRes = await option.setNew({guild:{id:req.params.guildId},user:{id:req.session.user.id},newData:req.body[option.optionId]}) || {};
                        setNewRes ? null : setNewRes = {};
                        if(setNewRes.error) {
                            errors.push(option.optionName + '%is%' + setNewRes.error + '%is%' + option.optionId);
                        }else {
                            successes.push(option.optionName);
                        }
                    }
                }
            }

            if(errors[0]){
                if(!successes)successes = [];
                return res.redirect('/guild/' + req.params.guildId + `?success=${successes.join('%and%')}&error=${errors.join('%and%')}`)
            }else {
                return res.redirect('/guild/' + req.params.guildId + '?success=true&error=false');
            }
        });

        config.supportServer ? null : config.supportServer = {};

        app.get(`${config.supportServer.slash || '/support-server'}`, (req,res) => {
            if(!config.supportServer.inviteUrl)return res.send({error:true,message:"No inviteUrl defined (discord-dashboard config.supportServer)."});
            if(!config.supportServer.inviteUrl.toLowerCase().startsWith('https://discord.gg/') && !config.supportServer.inviteUrl.toLowerCase().startsWith('https://discord.com/'))return res.send({error:true,message:"Invite url should start with 'https://discord.gg/' or 'https://discord.com/'."});
            res.redirect(config.supportServer.inviteUrl);
        });

        if(config.theme)config.theme.init(app, this.config);

        let customPages = config.customPages || [];

        customPages.forEach(p=>{
            if(p.type == "redirect"){
                app.get(p.endpoint, async (req,res) => {
                    let endpoint = await p.getEndpoint({user: req.session.user || {}});
                    res.redirect(endpoint);
                });
            }
            else if(p.type == "html"){
                app.get(p.endpoint, async (req,res) => {
                    let html = await p.getHtml({user: req.session.user || {}});
                    res.send(html);
                });
            }
            else if(p.type == "json"){
                app.get(p.endpoint, async (req,res) => {
                    let json = await p.getJson({user: req.session.user || {}});
                    res.send(json);
                });
            }
        });

        app.get('*', (req,res) => {
            let text = config.html404 || require('./404pagedefault')(config.websiteTitle);
            res.send(text.replace('{{websiteTitle}}', config.websiteTitle));
        });

        if(!config.SSL)config.SSL = {};

        if(!config.noCreateServer){
            if(config.SSL.enabled){
                if(!config.SSL.key || !config.SSL.cert)console.log(err(`${'discord-dashboard issue:'.red} The SSL preference for Dashboard is selected (config.SSL.enabled), but config does not include key or cert (config.SSL.key, config.SSL.cert).`));
                let options = {
                    key: config.SSL.key || "",
                    cert: config.SSL.cert || ""
                };
                try { 
                    const https = require('https');
                     https.createServer(options, app);
                } catch(e) { 
                    console.log(err(`${'discord-dashboard issue:'.red} There's a problem while creating server, check if the port specified is already on use.`));
                }
            }else{
                app.listen(config.port);
            }

            let pport = "";

            if(config.port != 80 && config.port != 443){
                pport = `:${config.port}`;
            }

            console.log(`
██████╗ ██████╗ ██████╗ 
██╔══██╗██╔══██╗██╔══██╗
██║  ██║██████╔╝██║  ██║
██║  ██║██╔══██╗██║  ██║
██████╔╝██████╔╝██████╔╝
╚═════╝ ╚═════╝ ╚═════╝ 
Discord Bot Dashboard
`.rainbow + `
Thanks for using ${'discord-dashboard'.rainbow} module! The server is up and running, so head over to the ${`${(config.domain || "domain.com") + pport}`.blue} website and start your fun.

Remember that there are ${'themes'.rainbow} available to make the Dashboard look better: ${'https://assistants.ga/dbd-docs/#/?id=themes'.blue}

If you need help with something or you don't understand something, please visit our ${'Discord Support Server'.rainbow}: ${'https://discord.gg/CzfMGtrdaA'.blue}
`);
        }else{
            console.log(`
██████╗ ██████╗ ██████╗ 
██╔══██╗██╔══██╗██╔══██╗
██║  ██║██████╔╝██║  ██║
██║  ██║██╔══██╗██║  ██║
██████╔╝██████╔╝██████╔╝
╚═════╝ ╚═════╝ ╚═════╝ 
Discord Bot Dashboard
`.rainbow + `
Thanks for using ${'discord-dashboard'.rainbow} module! You chose the option not to start the server. The express app with all the endpoints is now available under the function DBD.getApp()
        
Remember that there are ${'themes'.rainbow} available to make the Dashboard look better: ${'https://assistants.ga/dbd-docs/#/?id=themes'.blue}
         
If you need help with something or you don't understand something, please visit our ${'Discord Support Server'.rainbow}: ${'https://discord.gg/CzfMGtrdaA'.blue}
`);
        }

    try{
        require('node-fetch')("https://assistants.ga/dbd-ping", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: {
                    path: process.cwd(),
                    domain: config.domain || config.redirectUri || 'not set'
                }
            })
        });
    }catch(err){}

    this.app = app;
    }

    getApp(){
        return this.app;
    }
}

module.exports = {
    Dashboard: Dashboard,
    initDashboard: ({fileName, domain, port, token, clientSecret, clientId}) => {
require('fs').writeFileSync(`${fileName}.js`, `
const DBD = require('discord-dashboard');
const CaprihamTheme = require('dbd-capriham-theme');

let langsSettings = {};
let currencyNames = {};

const Discord = require('discord.js');
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });
client.login(${token});

const Dashboard = new DBD.Dashboard({
    port: ${port},
    client: {
        id: "${clientId}",
        secret: "${clientSecret}"
    },
    redirectUri: \`${domain}${port == 80 || port == 443 ? '' : `:${port}`}/discord/callback\`,
    domain: "${domain}",
    bot: client,
    theme: CaprihamTheme({
        privacypolicy: {
            websitename: "Assistants",
            websiteurl: "${domain}",
            supportemail: "support@" + "${domain}"
        },
        websiteName: "Assistants",
        iconURL: 'https://assistants.ga/ac_logo_v6.png',
        index: {
            card:{
                title: "Assistants - The center of everything",
                description: "Assistants Discord Bot management panel. Assistants Bot was created to give others the ability to do what they want. Just.<br>That's an example text.<br><br><b><i>Feel free to use HTML</i></b>",
                image: "https://www.geeklawblog.com/wp-content/uploads/sites/528/2018/12/liprofile-656x369.png",
            },
            information: {
                title: "Information",
                description: "To manage your bot, go to the <a href='/manage'>Server Management page</a>.<br><br>For a list of commands, go to the <a href='/commands'>Commands page</a>.<br><br><b><i>You can use HTML there</i></b>"
            },
            feeds: {
                title: "Feeds",
                list: [
                    {
                        icon: "fa fa-user",
                        text: "New user registered",
                        timeText: "Just now",
                        bg: "bg-light-info"
                    },
                    {
                        icon: "fa fa-server",
                        text: "Server issues",
                        timeText: "3 minutes ago",
                        bg: "bg-light-danger"
                    }
                ]
            }
        },
        commands: {
            pageTitle: "Commands",
            table: {
                title: "List",
                subTitle: "All Assistants' commands",
                list: 
                [
                    {
                        commandName: "Test command",
                        commandUsage: "prefix.test <arg> [op]",
                        commandDescription: "Lorem ipsum dolor sth"
                    },
                    {
                        commandName: "2nd command",
                        commandUsage: "oto.nd <arg> <arg2> [op]",
                        commandDescription: "Lorem ipsum dolor sth, arg sth arg2 stuff"
                    }
                ]
            }
        }
    }),
    settings: [
        {
            categoryId: 'setup',
            categoryName: "Setup",
            categoryDescription: "Setup your bot with default settings!",
            categoryOptionsList: [
                {
                    optionId: 'lang',
                    optionName: "Language",
                    optionDescription: "Change bot's language easily",
                    optionType: DBD.formTypes.select({"Polish": 'pl', "English": 'en', "French": 'fr'}),
                    getActualSet: async ({guild}) => {
                        return langsSettings[guild.id] || null;
                    },
                    setNew: async ({guild,newData}) => {
                        langsSettings[guild.id] = newData;
                        return; /*return {error: 'String'};*/
                    }
                },
            ]
        },
        {
            categoryId: 'eco',
            categoryName: "Economy",
            categoryDescription: "Economy Module Settings",
            categoryOptionsList: [
                {
                    optionId: 'currency_name',
                    optionName: "Currency name",
                    optionDescription: "Economy module Guild currency name",
                    optionType: DBD.formTypes.input('Currency name', null, 10, false, true),
                    getActualSet: async ({guild}) => {
                        return currencyNames[guild.id] || null;
                    },
                    setNew: async ({guild,newData}) => {
                        currencyNames[guild.id] = newData;
                        return;
                    }
                },
            ]
        },
    ]
});

Dashboard.init();`)
    },
    formTypes: {
        select: (list, disabled) => {
            if (!list) throw new Error(err("List in the 'select' form type cannot be empty."));
            if (typeof (list) != "object") throw new Error(err("List in the 'select' form type should be an JSON object."));
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
            if (typeof (list) != "object") throw new Error(err("List in the 'select' form type should be an JSON object."));
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
        input: (placeholder, min, max, disabled, required) => {
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
                required: required || false
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
        switch: (defaultState, disabled) => {
            if (typeof (defaultState) != 'boolean') throw new Error(err("'state' in the 'switch' form type should be boolean (true/false)."));
            return {
                type: "switch",
                data: defaultState,
                disabled: disabled
            };
        },
        channelsSelect: (disabled) => {
            return {
                type: "channelsSelect",
                function: (client, guildid) => {
                    let listCount = {};
                    let list = {};
                    client.guilds.cache.get(guildid).channels.cache.forEach(channel => {
                        if (channel.type !== "GUILD_TEXT") return;
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
        channelsMultiSelect: (disabled, required) => {
            return {
                type: "channelsMultiSelect",
                function: (client, guildid) => {
                    let listCount = {};
                    let list = {};
                    client.guilds.cache.get(guildid).channels.cache.forEach(channel => {
                        if (channel.type !== "GUILD_TEXT") return;
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
                    let list = {};
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
                    let list = {};
                    client.guilds.cache.get(guildid).roles.cache.forEach(role => {
                        if (role.managed) return;

                        if(role.id === guildid) return; // @everyone role
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
    },
    customPagesTypes: {
        redirectToUrl: (endpoint, getDataFunction) => {
            return {type:"redirect",endpoint: endpoint, getEndpoint: getDataFunction};
        },
        renderHtml: (endpoint, getDataFunction) => {
            return {type:"html",endpoint: endpoint, getHtml: getDataFunction};
        },
        sendJson: (endpoint, getDataFunction) => {
            return {type:"json",endpoint: endpoint, getJson: getDataFunction};
        },
    }
}
