const router = require('express').Router();
const scopes = ["identify", "guilds"];
const fetch = require('node-fetch');
const FormData = require('form-data');

const forceAuth = (req, res, next) => {
    if (!req.session.user) return res.redirect('/discord')
    else return next();
}

router.get('/', (req, res) => {
    if (req.session.user) return res.redirect('/');

    const clientId = req.client.id;
    const clientSecret = req.client.secret;
    const redirectUri = req.redirectUri;

    const authorizeUrl = `https://discordapp.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes.join('%20')}`;
    res.redirect(authorizeUrl);
});

router.get('/callback', (req, res) => {
    if (req.session.user) return res.redirect('/');

    const clientId = req.client.id;
    const clientSecret = req.client.secret;
    const redirectUri = req.redirectUri;
    
    const accessCode = req.query.code;
    if (!accessCode) throw new Error('No access code returned from Discord');

    const data = new FormData();
    data.append('client_id', clientId);
    data.append('client_secret', clientSecret);
    data.append('grant_type', 'authorization_code');
    data.append('redirect_uri', redirectUri);
    data.append('scope', scopes.join(' '));
    data.append('code', accessCode);

    fetch('https://discordapp.com/api/oauth2/token', {
        method: 'POST',
        body: data
    })
    .then(res => res.json())
    .then(response => {
        fetch('https://discordapp.com/api/users/@me', {
            method: 'GET',
            headers: {
                authorization: `${response.token_type} ${response.access_token}`
            },
        })
        .then(res2 => res2.json())
        .then(async userResponse => {
            userResponse.tag = `${userResponse.username}#${userResponse.discriminator}`;
            userResponse.avatarURL = userResponse.avatar ? `https://cdn.discordapp.com/avatars/${userResponse.id}/${userResponse.avatar}.png?size=1024` : null;

            req.session.user = userResponse;
            
        });
        fetch('https://discordapp.com/api/users/@me/guilds', {
            method: 'GET',
            headers: {
                authorization: `${response.token_type} ${response.access_token}`
            },
        })
        .then(res3 => res3.json())
        .then(userGuilds => {
            req.session.guilds = userGuilds;
            res.redirect('/');
        });
    });
});

router.get('/logout', forceAuth, (req, res) => {
    req.session.destroy();
    res.redirect('/')
});

module.exports = router;