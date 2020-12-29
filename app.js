// \|/
// lol, need to use some modules and setup express app & Discord bot, skip this
// /|\

const express = require('express');
const app = express();
const partials = require('express-partials');
const bodyParser = require('body-parser');
const session = require('express-session');
const db = require('quick.db');
const Discord = require('discord.js');
const config = require('./config.json')
const bot = new Discord.Client();

bot.login(config.token);

const port = 80;
app.set('port', port);

app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use(partials());
app.set('view engine', 'ejs');
app.use(express.static('static'));
app.use(session({
    secret: '48738924783748273742398747238',
    resave: false,
    saveUninitialized: false,
    expires: 604800000,
}));

app.listen(port, () => console.info(`Listening on port ${port}!`));

// \|/
// okk we are done now
// /|\

require('./router')(app); // There is a router for Discord.js there, thanks to which Discord Oauth2 works.

// First, when a visitor enters the home page, he should get the home page.
  app.get('/', (req, res) => {
    res.render('index', { user: req.session.user, req: req }); // this renders views/index.ejs
  });
  
// The logged-in user can check his 'profile' settings.
  app.get('/user', async (req, res) => {
    if(!req.session.user)return res.redirect('/authorize'); // Of course, if he is not logged in, he must do so.
    res.render('user', { user: req.session.user, req: req, db: db }); // this renders views/user.ejs
  });

// Whether you like it or not, the dashboard is for server management. This part is from displaying authorized user servers.
  app.get('/user/guilds', async (req, res) => {
    if(!req.session.user)return res.redirect('/'); // Likewise, he must be logged in. If not, let him do it.
    res.render('guilds', {db: db, session: session, req: req, user: req.session.user, bot: bot}); // this renders views/guilds.ejs
  });
  
// If we want to display information about an already selected server, create its house for it.
  app.get('/guild/:id', async function (req, res) { // Param ":id" means something that can be your own, customizable. In this case it will be the server ID. For example: /guild/671767027240796176 is uPros guild manage page.
    if(!req.session.user)return res.redirect('/'); // If the user is not logged in, let him do so.
    if(!bot.guilds.cache.get(req.params.id))return res.redirect('/user/guilds'); // If the bot is not on the server with the given ID, let's get the user back.
    const userObj = await bot.guilds.cache.get(req.params.id).members.cache.get(req.session.user.id);
    if(!userObj.hasPermission('MANAGE_GUILD'))return res.redirect('/user/guilds'); // Oh, I think he wanted to manage someone's server without permission on that server! Not so easy! Let's get him back!
    res.render('guild', {db: db, session: session, req: req, user: req.session.user, bot: bot}); // this renders views/guild.ejs
  });

// If someone wants to edit the settings contained in the setup category, the browser will make a POST request there.
  app.post('/edit/setup/:id', async (req, res) => {
    if(!req.session.user)return res.redirect('/'); // If the user is not logged in, let him do so.
    if(!bot.guilds.cache.get(req.params.id).members.cache.get(req.session.user.id).hasPermission('MANAGE_GUILD'))return res.redirect('/user/guilds'); // Oh, I think he wanted to manage someone's server without permission on that server! Not so easy! Let's get him back!
    await db.set(`${req.params.id}.prefix`, req.body.prefix.replace('\r\n', "")); // Set the bot prefix as the one we got in request body.
    if(req.body.lang == "en"){
      await db.set(`${req.params.id}.lang`, "en"); // If body.lang == en, set bot language as English.
    }else if(req.body.lang == "pl"){
      await db.set(`${req.params.id}.lang`, "pl"); // If body.lang == pl, set bot language as Polish.
    }else{
      await db.set(`${req.params.id}.lang`, "en"); // If body.lang != en && body.lang != pl, set bot language as English.
    }
    res.redirect('/guild/' + req.params.id); // Done! Let us return you to this server's page.
  });

// This part is only from the /api page rendered from the browser.
  app.get('/api', async (req, res) => {
    if(!req.session.user)return res.redirect('/authorize'); // If the user is not logged in, let him do so.
    res.render('api', { user: req.session.user, req: req, db: db }); // this renders views/api.ejs
  });

// If the user wants to refresh their token from the /user page, they will send it here.
  app.post('/token/regenerate', async (req, res) => {
    if(!req.session.user)return res.redirect('/authorize'); // If the user is not logged in, let him do so.
  
    const generateRandomString = function(length=10){
      return Math.random().toString(20).substr(2, length); // Generates random string.
      }
      await db.set(`${req.session.user.id}_token`, generateRandomString() + `${req.session.user.id}` + generateRandomString()); // Set-up a new token.
      res.redirect('/user'); // Return user to the /user page
  });

// If the user wants to refresh his token, but from the /api page, he will send it here.
  app.post('/token/regenerate/api', async (req, res) => {
    if(!req.session.user)return res.redirect('/authorize'); // If the user is not logged in, let him do so.
  
    const generateRandomString = function(length=10){
      return Math.random().toString(20).substr(2, length);// Generates random string.
      }
      await db.set(`${req.session.user.id}_token`, generateRandomString() + `${req.session.user.id}` + generateRandomString()); // Set-up a new token.
      res.redirect('/api'); // Return user to the /api page
  });


// \|/
// API - for more advanced projects, in which the user can make a request from another project to yours and obtain / transfer information.
// /|\

// Now let's go to the POST available without logging in.
// Note, you can get here from outside the site. Other projects can make the request here.
  app.post('/api/v1/example', async (req, res) => {
    if(!req.headers.authorization)return res.send({"error":true,"message":"No API key provided."}); // Check that the API token was provided.
    let token = req.headers.authorization; // token is "Authorization" header
    if(token.length != 38)return res.send({"error":true,"message":"An invalid key provided."}); // If the token is not long enough, it is invalid.
    let tokenOwner = token.slice(10,-10); // Determine who owns the token.
    let tokenDb = await db.get(`${tokenOwner}_token`); // This is the user's token, if any.
    if(tokenDb != token)return res.send({"error":true,"message":"An invalid key provided."}); // Check that this token is the same as this user.
    res.send({error: 'false',message: `you post this in body: ${JSON.stringify(req.body)}`}); // If all went well, return the data, do something with the received etc.
    //u can now do stuff with POSTED data and / or token's owner id
  });
