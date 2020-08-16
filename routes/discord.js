//  \|/
// Don't edit anything here without knowing Discord's oauth2.
//  /|\

const router = require('express').Router();

const { clientId, clientSecret, scopes, redirectUri } = require('../config.json');
const fetch = require('node-fetch');
const FormData = require('form-data');

const db = require('quick.db');

const forceAuth = (req, res, next) => {
    if (!req.session.user) return res.redirect('/authorize')
    else return next();
}

router.get('/', (req, res) => {
    if (req.session.user) return res.redirect('/');

    const authorizeUrl = `https://discordapp.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes.join('%20')}`;
    res.redirect(authorizeUrl);
});

router.get('/callback', (req, res) => {
    if (req.session.user) return res.redirect('/');
    
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

            req.session.user = userResponse; // Save user data in the session.user

            const generateRandomString = function(length=10){
                return Math.random().toString(20).substr(2, length); // Generates random string.
            }


            // Generate API key for the user if logged in for the first time.
            let kod = db.get(`${userResponse.id}_hasAuthCode`);
            if(!kod){
                await db.set(`${userResponse.id}_token`, generateRandomString() + `${userResponse.id}` + generateRandomString());
                await db.set(`${userResponse.id}_hasAuthCode`, true);
            }
            
        });
        fetch('https://discordapp.com/api/users/@me/guilds', {
            method: 'GET',
            headers: {
                authorization: `${response.token_type} ${response.access_token}`
            },
        })
        .then(res3 => res3.json())
        .then(userGuilds => {
            req.session.guilds = userGuilds; // Save user guilds data in the session.guilds
            res.redirect('/');
        });
    });
});

router.get('/logout', forceAuth, (req, res) => {
    req.session.destroy();
    res.redirect('/')
});

module.exports = router;