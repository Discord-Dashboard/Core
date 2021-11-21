const colors = require('colors');
const https = require("https");
const http = require("http");
const express = require("express");
const session = require("express-session");
const Discord = require("discord.js");
const bodyParser = require("body-parser");
const partials = require("express-partials");
const fs = require("fs");
const uuidv4 = require("uuid").v4;
const {
    Server: SocketServer
} = require("socket.io");
const DBDStats = require('./ExternalStatistics/index');

const err = (text) => {
    return text + ` Do you need help? Join our Discord server: ${'https://discord.gg/CzfMGtrdaA'.blue}`;
}

class Dashboard {
    constructor(config) {
        let notSetYetAndRequired = [];
        if (!config.port) notSetYetAndRequired.push('port');
        if (!config.theme) notSetYetAndRequired.push('theme');
        if (!config.client) notSetYetAndRequired.push('client');
        if (!config.redirectUri) notSetYetAndRequired.push('redirectUri');
        if (!config.bot) notSetYetAndRequired.push('bot');
        if (!config.settings) notSetYetAndRequired.push('settings');
        if (!config.domain) notSetYetAndRequired.push('domain');
        if (notSetYetAndRequired[0]) throw new Error(err(`You need to define some more things: ${notSetYetAndRequired.join(', ')}.`));
        this.config = config;
        this.modules = [];
    }

    async init() {
        DBDStats.registerProject(this.config.client.id);
        const fs = require('fs');
        if (fs.existsSync(require('path').join(__dirname, '/.devChannel'))) return this.secretInit(this.modules);
        let config = this.config;
        let themeConfig = {};
        if (config.theme) themeConfig = config.theme.themeConfig;
        const projectStats = fs.readFileSync(require('path').join(__dirname, '/project.json'));
        const projectData = JSON.parse(projectStats);
        if(!projectData.id)projectData.id = uuidv4();
        projectData.name = `${config.websiteTitle || themeConfig.websiteName}`;
        fs.writeFileSync(require('path').join(__dirname, '/project.json'), JSON.stringify(projectData, null, 3))
        if(config.acceptPrivacyPolicy) return this.secretInit(this.modules);
        const ppAccepted = fs.readFileSync(require('path').join(__dirname, '/ppAccepted.txt'), 'utf8');
        if (ppAccepted == "accepted") return this.secretInit(this.modules);
        let oThis = this;
        const readline = require("readline-sync");

        setTimeout(function() {
            console.log(`${'[Discord-dashboard v'.blue}${`${require('./package.json').version}]:`.blue} Hello! First of all, we would like to thank you for your trust and choosing the ${'discord-dashboard'.rainbow}.`)
        }, 2000);
        setTimeout(function() {
            console.log(`${'[Discord-dashboard v'.blue}${`${require('./package.json').version}]:`.blue} However, we must familiarize you with our privacy policy and describe to you how we collect your data.`);
        }, 4000);
        setTimeout(function() {
            console.log(`
${'[Discord-dashboard v'.blue}${`${require('./package.json').version}]:`.blue} To maintain the quality of our services at the highest level, we collect from you:
${'[Discord-dashboard v'.blue}${`${require('./package.json').version}]:`.blue} - The ID of your Discord-Client,
${'[Discord-dashboard v'.blue}${`${require('./package.json').version}]:`.blue} - The number of users who log in to your panel (we also collect their IDs, but only to distinguish them from other, same login sessions),
${'[Discord-dashboard v'.blue}${`${require('./package.json').version}]:`.blue} - The types of settings you use that go beyond the basic ones. It does not include settings such as sensitive settings, e.g. your bot data.
${'[Discord-dashboard v'.blue}${`${require('./package.json').version}]:`.blue} We must add that your data is available only to the Project Administrator - breathtake. Nobody else can see it. Your data is not transferred anywhere either.
        
${'[Discord-dashboard v'.red}${`${require('./package.json').version}]:`.red} If you can't type in the console, pass 'acceptPrivacyPolicy: true,' to the discord-dashboard config.`);
            let iCount = 0;

            function ask() {
                if (iCount > 0) console.log(`${'[Discord-dashboard v'.red}${`${require('./package.json').version}]:`.red}: You must accept our privacy policy to be able to use the module. Otherwise, you must delete the module.`);
                iCount++;
                const rlResponse = readline.question(`${'[Discord-dashboard v'.blue}${`${require('./package.json').version}]:`.blue} Do you accept it? (y/n) `);

                if (rlResponse == "y" || rlResponse == "yes") {
                    console.log(`${'[Discord-dashboard v'.green}${`${require('./package.json').version}]:`.green} Thank you. Now we will run the module for you. You will not need to re-approve our privacy policy again.`)
                    fs.writeFileSync(require('path').join(__dirname, '/ppAccepted.txt'), 'accepted');
                    setTimeout(function() {
                        oThis.secretInit(oThis.modules);
                    }, 1000);
                } else ask();
            }
            ask();
        }, 6000);

    }

    secretInit(modules) {
        const config = this.config;
        const express = require('express');
        const app = express();


        const session = require('express-session');
        const FileStore = require('session-file-store')(session);
        const bodyParser = require('body-parser');
        const partials = require('express-partials');

        let v13support = false;

        const Discord = require('discord.js');
        if (Discord.version.slice(0, 2) == "13") v13support = true;

        app.use(bodyParser.urlencoded({
            extended: true
        }));
        app.use(bodyParser.json());
        app.use(partials());

        if (config.theme) {
            app.set('views', config.theme.viewsPath);
            app.use(express.static(config.theme.staticPath));
            app.use('/', express.static(config.theme.staticPath));
            app.use('/:a/', express.static(config.theme.staticPath));
            app.use('/:a/:b/', express.static(config.theme.staticPath));
            app.use('/:a/:b/:c/', express.static(config.theme.staticPath));
            app.use('/:a/:b/:c/:d/', express.static(config.theme.staticPath));
        }
        app.set('view engine', 'ejs');
        app.set("config", this.config);

        let sessionIs;

        if (!config.sessionFileStore) config.sessionFileStore = false;

        if (config.sessionFileStore) {
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
        } else {
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
        if (config.theme) themeConfig = config.theme.themeConfig;

        if (!config.invite) config.invite = {};

        app.use((req, res, next) => {
            if (!req.body) req.body = {};

            req.client = config.client;
            req.redirectUri = config.redirectUri;

            req.themeConfig = themeConfig;

            req.botToken = config.bot.token;
            req.guildAfterAuthorization = config.guildAfterAuthorization || {};

            req.websiteTitle = config.websiteTitle || "Discord Web Dashboard";
            req.iconUrl = config.iconUrl || 'https://www.nomadfoods.com/wp-content/uploads/2018/08/placeholder-1-e1533569576673.png';
            next();
        });

        if (config.useUnderMaintenance) {
            app.get(config.underMaintenanceAccessPage || '/total-secret-get-access', (req, res) => {
                res.send(`
               <form action="${config.domain}${config.underMaintenanceAccessPage || '/total-secret-get-access'}" method="POST" >
                    <input id="accessKey" name="accessKey"/>
                    <button role="submit">Submit</button>
               </form>
               `)
            });

            app.post(config.underMaintenanceAccessPage || '/total-secret-get-access', (req, res) => {
                if (!req.body) req.body = {};
                const accessKey = req.body.accessKey;
                if (accessKey != config.underMaintenanceAccessKey) return res.send('Wrong key.');
                req.session.umaccess = true;
                res.redirect('/');
            });

            app.use((req, res, next) => {
                if (!req.session.umaccess && !req.session.user) return res.send(config.underMaintenanceCustomHtml || require('./underMaintenancePageDefault')(config.underMaintenance, false));
                else if(!req.session.umaccess && config.ownerIDs && !config.ownerIDs.includes(req.session.user.id)) return res.send(config.underMaintenanceCustomHtml || require('./underMaintenancePageDefault')(config.underMaintenance, true));
                else next();
            })
        }

        config.supportServer ? null : config.supportServer = {};

        if (config.theme) config.theme.init(app, this.config);

        module.exports.verysecretsettings = config;
        require('./router')(app);

        let customPages = config.customPages || [];

        customPages.forEach(p => {
            if (p.type == "redirect") {
                app.get(p.endpoint, async (req, res) => {
                    let endpoint = await p.getEndpoint({
                        user: req.session.user || {}
                    });
                    res.redirect(endpoint);
                });
            } else if (p.type == "html") {
                app.get(p.endpoint, async (req, res) => {
                    let html = await p.getHtml({
                        user: req.session.user || {}
                    });
                    res.send(html);
                });
            } else if (p.type == "json") {
                app.get(p.endpoint, async (req, res) => {
                    let json = await p.getJson({
                        user: req.session.user || {}
                    });
                    res.send(json);
                });
            }
        });

        modules.forEach(module => {
            module.app({
                app: app,
                config: this.config,
                themeConfig: themeConfig
            });
        });

        app.get('*', (req, res) => {
            let text = config.html404 || require('./404pagedefault')(config.websiteTitle || themeConfig.websiteName);
            res.send(text.replace('{{websiteTitle}}', config.websiteTitle || themeConfig.websiteName));
        });


        this.app = app;

        let server;

        if (!config.SSL) config.SSL = {};

        if (config.SSL.enabled) {
            if (!config.SSL.key || !config.SSL.cert) console.log(err(`${'discord-dashboard issue:'.red} The SSL preference for Dashboard is selected (config.SSL.enabled), but config does not include key or cert (config.SSL.key, config.SSL.cert).`));
            let options = {
                key: config.SSL.key || "",
                cert: config.SSL.cert || ""
            };
            try {
                const https = require('https');
                server = https.createServer(options, app);
            } catch (e) {
                console.log(err(`${'discord-dashboard issue:'.red} There's a problem while creating server, check if the port specified is already on use.`));
            }
        } else {
            const http = require('http');
            server = http.createServer(app);
        }

        let pport = "";

        if (config.port != 80 && config.port != 443) {
            pport = `:${config.port}`;
        }

        if (!config.minimizedConsoleLogs) {
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
        } else {
            console.log(`DBD Dashboard running on ${`${(config.domain || "domain.com") + pport}`.blue} !`);
        }

        const SocketServer = require("socket.io").Server;
        const io = new SocketServer(server, {
            cors: {
                origin: '*',
            },
        });

        this.io = io;

        modules.forEach(module => {
            module.server({
                io: this.io,
                server: server,
                config: this.config,
                themeConfig: themeConfig
            });
        });

        server.listen(config.port);
    }

    getApp() {
        return this.app;
    }

    useThirdPartyModule(module) {
        this.modules.push(module);
    }
}

module.exports = {
    Dashboard: Dashboard,
    initDashboard: ({
                        fileName,
                        domain,
                        port,
                        token,
                        clientSecret,
                        clientId
                    }) => {
        require('fs').writeFileSync(`${fileName}.js`, `
const DBD = require('discord-dashboard');
const CaprihamTheme = require('dbd-capriham-theme');

let langsSettings = {};
let currencyNames = {};

const Discord = require('discord.js');
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });
client.login(${token});

const Dashboard = new DBD.Dashboard({
    minimizedConsoleLogs: false,
    port: ${port},
    client: {
        id: "${clientId}",
        secret: "${clientSecret}"
    },
    redirectUri: \`${domain}${port == 80 || port == 443 ? '' : `:${port}`}/discord/callback\`,
    domain: "${domain}",
    bot: client,
    ownerIDs: [],
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
            if (typeof(defaultState) != 'boolean') throw new Error(err("'state' in the 'switch' form type should be boolean (true/false)."));
            return {
                type: "switch",
                data: defaultState,
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
    },
    customPagesTypes: {
        redirectToUrl: (endpoint, getDataFunction) => {
            return {
                type: "redirect",
                endpoint: endpoint,
                getEndpoint: getDataFunction
            };
        },
        renderHtml: (endpoint, getDataFunction) => {
            return {
                type: "html",
                endpoint: endpoint,
                getHtml: getDataFunction
            };
        },
        sendJson: (endpoint, getDataFunction) => {
            return {
                type: "json",
                endpoint: endpoint,
                getJson: getDataFunction
            };
        },
    }
}
