const colors = require('colors');

const err = (text) => {
    return text + ` Do you need help? Join our Discord server: ${'https://discord.gg/CzfMGtrdaA'.blue}`;
}

class Dashboard {
    constructor(config) {
        let notSetYetAndRequired = [];
        if(!config.port)notSetYetAndRequired.push('port');
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
        }else{
            app.set('views', require('path').join(__dirname, '/views/project1'));
            app.use(express.static(require('path').join(__dirname, '/static')));
            app.use('/', express.static(require('path').join(__dirname, '/static')));
            app.use('/:a/', express.static(require('path').join(__dirname, '/static')));
            app.use('/:a/:b/', express.static(require('path').join(__dirname, '/static')));
            app.use('/:a/:b/:c/', express.static(require('path').join(__dirname, '/static')));
            app.use('/:a/:b/:c/:d/', express.static(require('path').join(__dirname, '/static')));
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

        let themeConfig = {};
        if(config.theme)themeConfig = config.theme.themeConfig;

        if(!config.invite)config.invite = {};

        app.use((req,res,next)=>{
            if(!req.body)req.body={};

            req.client = config.client;
            req.redirectUri = config.redirectUri;

            req.themeConfig = themeConfig;

            req.websiteTitle = config.websiteTitle || "Discord Web Dashboard";
            req.iconUrl = config.iconUrl || 'https://www.nomadfoods.com/wp-content/uploads/2018/08/placeholder-1-e1533569576673.png';
            next();
        });

        require('./router')(app);

        app.get('/', (req,res) => {
            res.render('index', {req:req,themeConfig:req.themeConfig,bot:config.bot});
        });

        app.get('/invite', (req,res) => {
            res.redirect(`https://discord.com/oauth2/authorize?client_id=${config.invite.clientId || config.bot.user.id}&scope=bot&permissions=${config.invite.permissions || '0'}${config.invite.redirectUri ? `&response_type=code&redirect_uri=${config.invite.redirectUri}` : ''}`);
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
            res.render('guild', {settings:config.settings,actual:actual,bot:config.bot,req:req,guildid:req.params.id,themeConfig:req.themeConfig});
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

            category.categoryOptionsList.forEach(option=>{
                if(option.optionType.type == "switch"){
                    if(req.body[option.optionId] || req.body[option.optionId] == null || req.body[option.optionId] == undefined){
                        if(req.body[option.optionId] == null || req.body[option.optionId] == undefined){
                            option.setNew({guild:{id:req.params.guildId},user:{id:req.session.user.id},newData:false});
                        }else{
                            option.setNew({guild:{id:req.params.guildId},user:{id:req.session.user.id},newData:true});
                        }
                    }
                }else{
                    if(req.body[option.optionId] || req.body[option.optionId] == null)option.setNew({guild:{id:req.params.guildId},user:{id:req.session.user.id},newData:req.body[option.optionId]});
                }
            });

            return res.redirect('/guild/'+req.params.guildId+'?success=true');
        });

        if(config.theme)config.theme.init(app, this.config);

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
                const https = require('https');
                https.createServer(options, app);
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
    formTypes: {
        select: (list, disabled) => {
            if(!list)throw new Error(err("List in the 'select' form type cannot be empty."));
            if(typeof(list) != "object")throw new Error(err("List in the 'select' form type should be an JSON object."));
            let keys = Object.keys(list);
            let values = Object.values(list);
            return {type: "select", data: {keys,values}, disabled: disabled || false};
        },
        input: (placeholder, min, max, disabled, required) => {
            if(min){
                if(isNaN(min))throw new Error(err("'min' in the 'input' form type should be an number."));
            }
            if(max){
                if(isNaN(max))throw new Error(err("'max' in the 'input' form type should be an number."));
            }
            if(min && max){
                if(min>max)throw new Error(err("'min' in the 'input' form type cannot be higher than 'max'."));
            }
            return {type: "input", data: placeholder, min: min || null, max: max || null, disabled: disabled || false, required: required || false};
        },
        textarea: (placeholder, min, max, disabled, required) => {
            if(min){
                if(isNaN(min))throw new Error(err("'min' in the 'input' form type should be an number."));
            }
            if(max){
                if(isNaN(max))throw new Error(err("'max' in the 'input' form type should be an number."));
            }
            if(min && max){
                if(min>max)throw new Error(err("'min' in the 'input' form type cannot be higher than 'max'."));
            }
            return {type: "textarea", data: placeholder, min: min || null, max: max || null, disabled: disabled || false, required: required || false};
        },
        switch: (defaultState, disabled) => {
            if(typeof(defaultState) != 'boolean')throw new Error(err("'state' in the 'switch' form type should be boolean (true/false)."));
            return {type:"switch",data:defaultState,disabled:disabled};
        },
        channelsSelect: (disabled) => {
            return {type:"channelsSelect", function:
                (client, guildid) => {
                    let listCount = {};
                    let list = {};
                    client.guilds.cache.get(guildid).channels.cache.forEach(channel=>{
                        listCount[channel.name] ? listCount[channel.name] = listCount[channel.name] + 1 : listCount[channel.name] = 1;
                        if(list[channel.name])list[`${channel.name} (${listCount[channel.name]})`] = channel.id;
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

                    return {values:Object.values(list),keys:Object.keys(list)};
                }, 
                disabled};
        },
        rolesSelect: (disabled) => {
            return {type:"rolesSelect", function:
                (client, guildid) => {
                    let listCount = {};
                    let list = {};
                    client.guilds.cache.get(guildid).roles.cache.forEach(role=>{
                        listCount[role.name] ? listCount[role.name] = listCount[role.name] + 1 : listCount[role.name] = 1;
                        if(list[role.name])list[`${role.name} (${listCount[role.name]})`] = role.id;
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

                    return {values:Object.values(list),keys:Object.keys(list)};
                }, 
                disabled};
        },
        colorSelect: (defaultState, disabled) => {
            return {type:"colorSelect",data:defaultState,disabled};
        }
    },
}
