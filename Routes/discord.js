const router = require('express').Router();
const scopes = ["identify", "guilds", "guilds.join"];
const fetch = require('node-fetch');
const FormData = require('form-data');
const DBDStats = require('../ExternalStatistics/index');

const DiscordOauth2 = require("discord-oauth2");
const oauth = new DiscordOauth2();

router.get('/', (req, res) => {
    const clientId = req.client.id;
    const redirectUri = req.redirectUri;

    req.session.r = req.query.r || '/';

    const authorizeUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes.join('%20')}`;
    res.redirect(authorizeUrl);
});

router.get('/callback', async (req, res) => {
    const clientId = req.client.id;
    const clientSecret = req.client.secret;
    const redirectUri = req.redirectUri;

    const accessCode = req.query.code;
    if (!accessCode) return res.redirect('/?error=NoAccessCodeReturnedFromDiscord');

    let OAuth2Response;
    let OAuth2UserResponse;
    let OAuth2GuildsResponse;

    /*
    Get Discord OAuth2 API Response with Access Code gained
    */
    try {
        OAuth2Response = await oauth.tokenRequest({
            clientId,
            clientSecret,

            code: accessCode,
            scope: scopes.join(' '),
            grantType: "authorization_code",

            redirectUri,
        });
    }catch(err){
        req.config.reportError('Discord.js Route - OAuth2Response (line 47)', err);
        return res.redirect('/?error='+err.message);
    }


    /*
    Get User from Discord OAuth2 API using gained access_token and update its values with tag and avatarURL
    */

    try {
        OAuth2UserResponse = await oauth.getUser(OAuth2Response.access_token);
    }catch(err){
        req.config.reportError('Discord.js Route - OAuth2UserResponse (line 59)', err);
        return res.redirect('/?error='+err.message);
    }
    OAuth2UserResponse.tag = `${OAuth2UserResponse.username}#${OAuth2UserResponse.discriminator}`;
    OAuth2UserResponse.avatarURL = OAuth2UserResponse.avatar ? `https://cdn.discordapp.com/avatars/${OAuth2UserResponse.id}/${OAuth2UserResponse.avatar}.png?size=1024` : null;

    /*
    Save user token in Assistants Secure Storage
    */

    try{
        req.AssistantsSecureStorage.SaveUser(OAuth2UserResponse.id, OAuth2Response.access_token);
    }catch(err){
        req.config.reportError('Discord.js Route - Assistants Secure Storage (line 72)', err);
        return res.redirect('/?error='+err.message);
    }

    /*
    Save user in session
    */

    req.session.user = OAuth2UserResponse;
    req.session.loggedInLastTime = true;

    /*
    Register user to DBD Stats and emit userLoggedIn event
    */

    try {
        DBDStats.registerUser(OAuth2UserResponse.id);
        req.DBDEvents.emit('userLoggedIn', OAuth2UserResponse);
    }catch(err){
        req.config.reportError('Discord.js Route - DBDStats register and DBDEvent emit userLoggedIn (line 91)', err);
        return res.redirect('/?error='+err.message);
    }

    /*
    Gain and update session with user guilds
    */

    try {
        OAuth2GuildsResponse = await oauth.getUserGuilds(OAuth2Response.access_token);
    }catch(err){
        req.config.reportError('Discord.js Route - OAuth2GuildsResponse (line 102)', err);
        return res.redirect('/?error='+err.message);
    }
    req.session.guilds = OAuth2GuildsResponse || [];

    /*
    Loop and fetch each guild into bots cache
     */

    try {
        for (let g of OAuth2GuildsResponse) {
            try {
                if (!req.bot.guilds.cache.get(g.id)) {
                    if ((g.permissions & 0x00000020) == 0x00000020) {
                        await req.bot.guilds.fetch(g.id);
                    }
                }
            } catch (err) {
            }
        }
    }catch(err){
        req.config.reportError('Discord.js Route - OAuth2GuildsResponse Whole Loop (line 123)', err)
        return res.redirect('/?error='+err.message);
    }

    /*
    If joining specific guild after authorization is enabled, do it
     */

    if (req.guildAfterAuthorization.use == true) {
        try {
            await oauth.addMember({
                accessToken: OAuth2Response.access_token,
                botToken: req.botToken,
                guildId: req.guildAfterAuthorization.guildId,
                userId: OAuth2UserResponse.id,

                ...req.guildAfterAuthorization.options || {},
                /*
                options?: {
                    nickname?: string,
                    roles?: [string],
                    mute?: boolean,
                    deaf?: boolean,
                }
                */
            });
        }catch(err){
            req.config.reportError('Discord.js Route - guildAfterAuthorization (line 150)', err);
            return res.redirect('/?error='+err.message);
        }
    }

    /*
    As everything is done, redirect user back to Discord-Dashboard
     */

    return res.redirect(req.session.r || '/');
});

router.get('/logout', (req, res) => {
    let r = req.query.r || '/';
    req.session.destroy();
    res.redirect(r);
});


router.get('/guilds/reload', async (req,res)=>{
    if(!req.session.user)return res.redirect('/discord');

    /*
    Fetch user token
     */

    const access_token = req.AssistantsSecureStorage.GetUser(req.session.user.id);
    if(!access_token)return res.send({error:true,message:"You don't have any access_token saved.", login_again_text: true});

    /*
    Gain and update session with user guilds
    */

    let OAuth2GuildsResponse;

    try {
        OAuth2GuildsResponse = await oauth.getUserGuilds(access_token);
    }catch(err){
        req.config.reportError('Discord.js Route - OAuth2GuildsResponse for ReloadGuilds (line 183)', err);
        return res.send({error:true, message: "An error occured. Access_token is wrong or you're being rate limited.", login_again_text: true});
    }
    req.session.guilds = OAuth2GuildsResponse || [];

    /*
    Loop and fetch each guild into bots cache
     */

    try {
        for (let g of OAuth2GuildsResponse) {
            try {
                if (!req.bot.guilds.cache.get(g.id)) {
                    if ((g.permissions & 0x00000020) == 0x00000020) {
                        await req.bot.guilds.fetch(g.id);
                    }
                }
            } catch (err) {
            }
        }
    }catch(err){
        req.config.reportError('Discord.js Route - OAuth2GuildsResponse Whole Loop for ReloadGuilds (line 204)', err)
        return res.send({error:true, message: "An error occured. Access_token is wrong or you're being rate limited.", login_again_text: true});
    }

    /*
    Success
     */

    return res.send({error:false,message:null,login_again_text:false});
});

module.exports = router;
