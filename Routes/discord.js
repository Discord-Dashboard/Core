const router = require('express').Router();
const scopes = ["identify", "guilds", "guilds.join"];
const fetch = require('node-fetch');
const FormData = require('form-data');
const DBDStats = require('../ExternalStatistics/index');

router.get('/', (req, res) => {
    const clientId = req.client.id;
    const redirectUri = req.redirectUri;

    req.session.r = req.query.r || '/';

    const authorizeUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes.join('%20')}`;
    res.redirect(authorizeUrl);
});

router.get('/callback', (req, res) => {
    const clientId = req.client.id;
    const clientSecret = req.client.secret;
    const redirectUri = req.redirectUri;

    const accessCode = req.query.code;
    if (!accessCode) return res.redirect('/?error=NoAccessCodeReturnedFromDiscord');

    const data = new FormData();
    data.append('client_id', clientId);
    data.append('client_secret', clientSecret);
    data.append('grant_type', 'authorization_code');
    data.append('redirect_uri', redirectUri);
    data.append('scope', scopes.join(' '));
    data.append('code', accessCode);

    fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        body: data
    })
        .then(res => res.json())
        .then(response => {
            fetch('https://discord.com/api/users/@me', {
                method: 'GET',
                headers: {
                    authorization: `${response.token_type} ${response.access_token}`
                },
            })
                .then(res2 => res2.json())
                .then(async userResponse => {
                    userResponse.tag = `${userResponse.username}#${userResponse.discriminator}`;
                    userResponse.avatarURL = userResponse.avatar ? `https://cdn.discordapp.com/avatars/${userResponse.id}/${userResponse.avatar}.png?size=1024` : null;

                    DBDStats.registerUser(userResponse.id);
                    req.session.loggedInLastTime = true;

                    req.DBDEvents.emit('userLoggedIn', userResponse);

                    req.session.user = userResponse;
                    fetch('https://discord.com/api/users/@me/guilds', {
                        method: 'GET',
                        headers: {
                            authorization: `${response.token_type} ${response.access_token}`
                        },
                    })
                        .then(res3 => res3.json())
                        .then(async (userGuilds) => {
                            req.session.guilds = userGuilds;

                            for(let g of userGuilds){
                                try{
                                    if(!req.bot.guilds.cache.get(g.id)){
                                        if((g.permissions & 0x00000020) == 0x00000020){
                                            await req.bot.guilds.fetch(g.id);
                                        }
                                    }
                                }catch(err){}
                            }

                            if (req.guildAfterAuthorization.use == true) {
                                try {
                                    let guild = client.guilds.cache.get(
                                        `${req.guildAfterAuthorization.guildId}`
                                    );
                                    guild.members
                                        .add(req.session.user.id, {
                                            accessToken: `${response.access_token}`,
                                        })
                                        .then(() => res.redirect(req.session.r || "/"));
                                }catch(err){
                                    return res.redirect(req.session.r || '/');
                                }
                            } else {
                                res.redirect(req.session.r || '/');
                            }
                        });

                });
        });
});

router.get('/logout', (req, res) => {
    let r = req.query.r || '/';
    req.session.destroy();
    res.redirect(r);
});

module.exports = router;
