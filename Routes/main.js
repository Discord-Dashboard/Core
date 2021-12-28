const Discord = require("discord.js");
const router = require('express').Router();

module.exports = (app, config, themeConfig) => {
    router.get('/', async (req, res) => {
        let customThemeOptions;
        if(themeConfig.customThemeOptions) {
            customThemeOptions = await themeConfig.customThemeOptions.index({req: req, res: res, config: config});
        }
        res.render('index', {
            req: req,
            themeConfig: req.themeConfig,
            bot: config.bot,
            customThemeOptions: customThemeOptions || {}
        });
    });

    if (!config.invite) config.invite = {};

    router.get('/invite', (req, res) => {
        const scopes = config.invite.scopes || ["bot"];
        if (req.query.g) {
            return res.redirect(`https://discord.com/oauth2/authorize?client_id=${config.invite.clientId || config.bot.user.id}&scope=${scopes.join('%20')}&permissions=${config.invite.permissions || '0'}${config.invite.redirectUri ? `&response_type=code&redirect_uri=${config.invite.redirectUri}` : ''}${config.invite.otherParams || ''}&guild_id=${req.query.g}`);
        }
        res.redirect(`https://discord.com/oauth2/authorize?client_id=${config.invite.clientId || config.bot.user.id}&scope=${scopes.join('%20')}&permissions=${config.invite.permissions || '0'}${config.invite.redirectUri ? `&response_type=code&redirect_uri=${config.invite.redirectUri}` : ''}${config.invite.otherParams || ''}`);
    });

    config.supportServer ? null : config.supportServer = {};

    router.get(`${config.supportServer.slash || '/support-server'}`, (req, res) => {
        if (!config.supportServer.inviteUrl) return res.send({
            error: true,
            message: "No inviteUrl defined (discord-dashboard config.supportServer)."
        });
        if (!config.supportServer.inviteUrl.toLowerCase().startsWith('https://discord.gg/') && !config.supportServer.inviteUrl.toLowerCase().startsWith('https://discord.com/')) return res.send({
            error: true,
            message: "Invite url should start with 'https://discord.gg/' or 'https://discord.com/'."
        });
        res.redirect(config.supportServer.inviteUrl);
    });

    return router;
}