const { Router } = require('express');
const app = Router();
let hacky = require("../index").verysecretsettings

app.get(`${hacky.supportServer.slash || '/support-server'}`, (req, res) => {
    if (!req.app.get("config").supportServer.inviteUrl) return res.send({
        error: true,
        message: "No inviteUrl defined (discord-dashboard req.app.get(\"config\").supportServer)."
    });
    if (!req.app.get("config").supportServer.inviteUrl.toLowerCase().startsWith('https://discord.gg/') && !req.app.get("config").supportServer.inviteUrl.toLowerCase().startsWith('https://discord.com/')) return res.send({
        error: true,
        message: "Invite url should start with 'https://discord.gg/' or 'https://discord.com/'."
    });
    res.redirect(req.app.get("config").supportServer.inviteUrl);
});

app.get('/manage', (req, res) => {
    if (!req.session.user) return res.redirect('/discord?r=/manage');
    res.render('guilds', {
        req: req,
        bot: req.app.get("config").bot,
        themeConfig: req.themeConfig
    });
});

app.get('/', (req, res) => {
    res.render('index', {
        req: req,
        themeConfig: req.themeConfig,
        bot: req.app.get("config").bot
    });
});

app.get('/invite', (req, res) => {
    const scopes = req.app.get("config").invite.scopes || ["bot"];
    if (req.params.g) {
        return res.redirect(`https://discord.com/oauth2/authorize?client_id=${req.app.get("config").invite.clientId || req.app.get("config").bot.user.id}&scope=${scopes.join('%20')}&permissions=${req.app.get("config").invite.permissions || '0'}${req.app.get("config").invite.redirectUri ? `&response_type=code&redirect_uri=${req.app.get("config").invite.redirectUri}` : ''}${req.app.get("config").invite.otherParams || ''}&guild_id=${req.params.g}`);
    }
    res.redirect(`https://discord.com/oauth2/authorize?client_id=${req.app.get("config").invite.clientId || req.app.get("config").bot.user.id}&scope=${scopes.join('%20')}&permissions=${req.app.get("config").invite.permissions || '0'}${req.app.get("config").invite.redirectUri ? `&response_type=code&redirect_uri=${req.app.get("config").invite.redirectUri}` : ''}${req.app.get("config").invite.otherParams || ''}`);
});

module.exports = app;