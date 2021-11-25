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
        require('./InitFunctions/initPpCheck')(this.config, this.config.theme.themeConfig, DBDStats, this.secretInit, this.modules, this);
    }

    secretInit(modules) {
        const config = this.config;
        const express = require('express');
        const app = express();
        const session = require('express-session');
        const FileStore = require('session-file-store')(session);
        const bodyParser = require('body-parser');
        const partials = require('express-partials');
        const v13support = require('discord.js').version.slice(0, 2) == "13";

        app.use(bodyParser.urlencoded({
            extended: true
        }));
        app.use(bodyParser.json());
        app.use(partials());
        app.set('views', config.theme.viewsPath);
        app.use(express.static(config.theme.staticPath));app.use('/', express.static(config.theme.staticPath));app.use('/:a/', express.static(config.theme.staticPath));app.use('/:a/:b/', express.static(config.theme.staticPath));app.use('/:a/:b/:c/', express.static(config.theme.staticPath));app.use('/:a/:b/:c/:d/', express.static(config.theme.staticPath));
        app.set('view engine', 'ejs');

        let sessionData = {
            secret: config.cookiesSecret || 'total_secret_cookie_secret',
            resave: true,
            saveUninitialized: true,
            cookie: {
                expires: new Date(253402300799999),
                maxAge: 253402300799999,
            },
        };
        config.sessionFileStore ? sessionData.store = new FileStore : null;
        app.use(session(sessionData));

        let themeConfig = config.theme.themeConfig;

        app.use((req, res, next) => {
            if(req.session.loggedInLastTime == true){
                req.displayLoggedInInfo = true;
                req.session.loggedInLastTime = false;
            }
            if (!req.body) req.body = {};

            req.v13support = v13support;

            req.client = config.client;
            req.redirectUri = config.redirectUri;

            req.themeConfig = themeConfig;

            req.botToken = config.bot.token;
            req.guildAfterAuthorization = config.guildAfterAuthorization || {};

            req.websiteTitle = config.websiteTitle || "Discord Web Dashboard";
            req.iconUrl = config.iconUrl || 'https://www.nomadfoods.com/wp-content/uploads/2018/08/placeholder-1-e1533569576673.png';

            req.app = app;
            req.config = config;
            next();
        });

        require('./router')(app, config, themeConfig, modules);

        this.app = app;
        let sio = require('./InitFunctions/initServer')(app, config, themeConfig, modules);
        this.server = sio.server;
        this.io = sio.io;
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
    initDashboard: ({fileName, domain, port, token, clientSecret, clientId}) => {
        require('./InitFunctions/initExampleDash')({fileName, domain, port, token, clientSecret, clientId});
    },
    formTypes: require('./ModuleExportsFunctions/formTypes'),
    customPagesTypes: require('./ModuleExportsFunctions/customPagesTypes')
}
