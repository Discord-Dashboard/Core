# Install

```js
npm i discord-dashboard dbd-capriham-theme
```
or
```js
npm i discord-web-dashboard dbd-capriham-theme
```


# Docs website

Better looking documentation with navigation: https://assistants.ga/dbd-docs/#/

# Full Example


NEW: Init full example discord-dashboard file.
This will create an empty file with discord-dashboard empty default project.

```js
const DBD = require('discord-dashboard');

DBD.initDashboard({fileName:'test-file',domain:'http://localhost', port: 80, token: '123', clientSecret: '456', clientId: '789'});
```

Default empty project code to copy:

```js
const DBD = require('discord-dashboard');
const CaprihamTheme = require('dbd-capriham-theme');

let langsSettings = {};

let currencyNames = {};

let botNicknames = {};

const Discord = require('discord.js');
const client = new Discord.Client();
client.login("botToken");

const Dashboard = new DBD.Dashboard({
    port: 80,
    client: {
        id: 'clientId',
        secret: 'clientSecret'
    },
    redirectUri: 'http://localhost/discord/callback',
    domain: 'http://localhost',
    bot: client,
    theme: CaprihamTheme({
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
                        return;
                    }
                },
                {
                    optionId: 'nickname',
                    optionName: "Nickname",
                    optionDescription: "Bot's nickname on the guild",
                    optionType: DBD.formTypes.input("Bot username", 1, 16, false, true),
                    getActualSet: async ({guild}) => {
                        return botNicknames[guild.id] || false;
                    },
                    setNew: async ({guild,newData}) => {
                        botNicknames[guild.id] = newData;
                        return;
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

Dashboard.init();
```

<hr>

# Documentation

Official **Discord Web Dashoard** documentation. The best way to create a Web Dashboard for your Discord Bot! No need to edit files or write the server from scratch!

All available functions are described below.

## Get help

Join our Discord server to get help: https://discord.gg/CHbfcSbEgd

## LICENSE

The project is licensed by [MIT](https://en.wikipedia.org/wiki/MIT_License). This means that you can edit it, but you must mention its author publicly in this project (breftejk, Github: https://github.com/breftejk, Discord Server: https://discord.gg/CHbfcSbEgd).

## Initial steps

### Installing the module

To install all the modules needed for the project to run, you need to run one simple command:

```
npm i discord-dashboard
```

### Setup

For the Dashboard to work, you need to create the server it will be based on. Fortunately, we help you with this and you can do it this way:

```js
const DBD = require('discord-dashboard');

const Dashboard = new DBD.Dashboard(config);
```

For TypeScript:

```js
import { Dashboard } from 'discord-dashboard';

const DD = new Dashboard(config);
```

That's all. The server is ready to run. Before starting up, however, you must understand the options needed to start the server.

#### What's config

Thanks to the config, server knows how to behave and what settings to use. There are many useful options as described in the [Config](#config) section.

#### Server start

For everything to start working, the server needs to be started. After setting config, all you have to do is do:

```js
Dashboard.init();
```

Where `Dashboard` is your first step in the [Setup](#setup) section.

## Config

It depends on how your Dashboard will work and look. If you want it to have a "Setup" section with a "Language" setting, set it up here. If you want it to have a crocodile icon, do it here. If you want it to run on port 80, do so here. It all depends on config.

### Server Stuff

Config allows you to set server-stuff. All the options available here are:

```js
...
  port: 80,
  domain: 'http://localhost',
  sessionFileStore: true/false,
  SSL: {
    enabled: true/false,
    key: 'key string or fs readFileSync',
    cert: 'cert string or fs readFileSync'
  },
  invite: {
    redirectUri: 'http://domain.com/ (website to redirect after inviting the bot - must be added to the trusted uris',
    permissions: 'permissions numer, by default 0',
    clientId: 'Client ID, by default is set to config.bot.user.id',
    scopes: ["bot"],
    otherParams: "&state=15773059ghq9183habn"
  },
  noCreateServer: false,
  supportServer: {
    slash: '/support-server',
    inviteUrl: 'https://discord.gg/Nkc8MWxHRD'
  },
  minimizedConsoleLogs: false
...
```

To get express-app with all the endpoints, use:

```js
DBD.getApp();
```

### Discord Stuff

The dashboard will never work without a few required settings. These include **Redirect URI**, **Client ID**, **Client Secret** and **Discord.js v12 Client**. We write more about them in the [Discord](#discord) section.

```js
const Discord = require('discord.js');
const DiscordClient = new Discord.Client();
DiscordClient.login('application_bot_token');
...

...
  client: {
    id: 'application_client_id',
    secret: 'application_client_secret'
  },
  redirectUri: 'http://localhost/discord/callback',
  bot: DiscordClient,
...
```

### Automatic Support Server Join

If you want the user to be automatically added to your server immediately after logging into the Dashboard, use this option.

PS. The bot must be on this server and have the security to create permissions there.

```js
...
    guildAfterAuthorization: {
        use: true,
        guildId: 'Your support guild id',
    },
...
```

### Website Stuff

You can also change the name, icon, etc. of the page itself.

```js
...
  websiteTitle: 'Discord Web Dashboard',
  iconUrl: 'https://domain.com/icon.png',
  html404: `<!DOCTYPE html>
  <html>
    <head>
        <title>{{websiteTitle}} - 404 Page Not Found</title>
    </head>
    <body>
        <h1>404 Not Found</h1>
        <a href="/">Take me back home</a>
    </body>
  </html>`,
...
```

### Under Maintenance Mode


Use this mode if you don't want users to be able to access the Dashboard. A page informing about the technical break will be displayed. In order for you to be able to access the site despite blocking it, you must set:

`underMaintenanceAccessKey`: The key that will allow you to access the blocked Dashboard (during the maintenance break).
`underMaintenanceAccessPage`: After entering this page, a field for entering the accessKey you have set up will appear. All you have to do now is click Submit and you have access to the site despite the maintenance mode!

#### Ready Built-In Maintenance Page

You can change the color of the technical break page. All available options are shown in the example below.

![Image](https://cdn.assistants.ga/kvzmqybi)

```js
...
    underMaintenanceAccessKey: 'totalsecretkey',
    underMaintenanceAccessPage: '/total-secret-get-access',
    useUnderMaintenance: true,
    underMaintenance: {
        title: 'Under Maintenance',
        contentTitle: 'This page is under maintenance',
        texts: [
        '<br>',
        'We still want to change for the better for you.',
        'Therefore, we are introducing technical updates so that we can allow you to enjoy the quality of our services.',
        '<br>',
        'Come back to us later or join our <a href="#">Discord Support Server</a>'
    ],
        bodyBackgroundColors: ['#ffa191', '#ffc247'],
        buildingsColor: '#ff6347',
        craneDivBorderColor: '#ff6347',
        craneArmColor: '#f88f7c',
        craneWeightColor: '#f88f7c',
        outerCraneColor: '#ff6347',
        craneLineColor: '#ff6347',
        craneCabinColor: '#f88f7c',
        craneStandColors: ['#ff6347', , '#f29b8b']
},
...
```

####  Own maintenance page

To set up your own page, you must set underMaintenanceCustomHtml instead of underMaintenance.

```js
...
    underMaintenanceAccessKey: 'totalsecretkey',
    underMaintenanceAccessPage: '/total-secret-get-access',
    useUnderMaintenance: true,
    underMaintenanceCustomHtml: `
    <!DOCTYPE html>
    <html>
        <head>
            <title>Under Maintenance</title>
        </head>
        <body>
            <h1>Under Maintenance</h1>
        </body>
    </html>
    `,
...
```

### Themes

You can also use themes to change the look of the page. To do this, you need to use additional modules and 'connect' them to the project.

If there are new themes, we'll write about them **here**, on [Discord Server](https://discord.gg/CHbfcSbEgd) and [Twitter](https://twitter.com/assistantsga).

```js
...
  theme: <ThemeModule>,
...
```

**PS**: *Themes in a Github project are located in the themes folder, you can also access them there. Themes in package with npm must be used as separate modules.*

#### Capriham

##### New: Dark Capriham created by iMidnight

```js
npm i dbd-dark-dashboard
```

https://www.npmjs.com/package/dbd-dark-dashboard

![Image](https://camo.githubusercontent.com/a5768145e7ca3f74d4673fb99937251734f1ed4b9a85f15e1a3057826cc86cd6/68747470733a2f2f692e696d6775722e636f6d2f3333736b3947692e706e67)

##### Install

```
npm i dbd-capriham-theme
```

##### Full config example

```js
const DBD = require('discord-dashboard');
const CaprihamTheme = require('dbd-capriham-theme');

const Dashboard = new DBD.Dashboard({
...
    theme: CaprihamTheme({
        websiteName: "Assistants",
        iconURL: 'https://assistants.ga/ac_logo_v6.png',
        index: {
            card:{
                title: "Assistants - The center of everything",
                description: "Assistants Discord Bot management panel. Assistants Bot was created to give others the ability to do what they want. Just.<br>That's an example text.<br><br><b><i>Feel free to use HTML</i></b>",
                //image: "https://www.geeklawblog.com/wp-content/uploads/sites/528/2018/12/liprofile-656x369.png",
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
...
});

Dashboard.init();
```

##### Look

![image1](https://cdn.assistants.ga/kqwivftx)
![image2](https://cdn.assistants.ga/kqwiwlw2)
![image3](https://cdn.assistants.ga/kqwiwvr1)
![image4](https://cdn.assistants.ga/kqwix3i7)

### Settings Stuff

Settings - that's what we called something that is basically the most important here. Settings are divided into Sections, and each Section has its own Options.

Sounds horrible, I know. Therefore, we have created a [Settings](#settings) section that describes everything.

```js
...
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
                    optionType: DBD.formTypes.select({"Polish": 'pl', "English": 'en'}),
                    getActualSet: async ({guild}) => {
                        const lang = await <db>.get(`${guild.id}.lang`);
                        return lang || null;
                    },
                    setNew: async ({guild,newData}) => {
                        await <db>.set(`${guild.id}.lang`, newData);
                        return;
                    }
                },
            ]
        },
    ]
...
```

## Settings

### Category

Each category has this something to it. It defines the settings sections. Because settings can be for different things, right? Therefore, the "Setup" and "Economy" sections will look separately in the basic panel like this:

![Image](https://assistants.ga/dashboard_tabs.png)

Cool is not it?

Each category is divided into:
* **categoryId**: It's a category ID. Ideally with basic characters (a-z, 0-9) to avoid bugs. The ID may also appear in the page URL.
* **categoryName**: The category name is displayed as the TAB name on the settings page.
* **categoryDescription**: The basic theme doesn't include this, but some may. This is a description of a section and its settings.
* **categoryOptionsList**: This is a list of all the options that can be put into a category. These are the options we call settings and want to change them, that's the purpose of the Dashboard. [The next part of the documentation](#options) is about the Options.

### Options

If you want the bot to be able to change the language by selecting it from the Select Box, you need to set it up. That's what Options are for.

* **optionId**: It's a option ID. Ideally with basic characters (a-z, 0-9) to avoid bugs. The ID may also appear in the page URL.
* **optionName**: That's the name of the option. It always appears in the settings TAB.
* **optionDescription**: That's the description of the option. It always appears in the settings TAB.
* **optionType**: This is very important because this is what defines the way data is received. Whether it should be textInput, input, selectBox or ToogleSwitch. You will establish it here. How? [We've documented it below](#option-types).
* **getActualSet**: It's an async function that is going to give us the data that is currently set to be able to display on the website. The type of data you should return depends on the optionType.
* **setNew**: This is an async/normal function that we call whenever someone changes the settings of this Option. We return in it: `{guild,user,newData}`, where guild and user are: `{id: guild / user ID}`. `guild#id` is the server affected by the change, and the `user#id` is the person who made the change. `newData` is the new data to which the Option applies. Return `{error: 'String'}` with this function to display an error.

## Option Types

What are the optionTypes? How to get them?

### How to get

The important thing is that option Types are contained in the module itself, not in the Dashboard. Therefore, to get them, you need to do this:

```js
const DBD = require('discord-dashboard');
...

...
  optionType: DBD.formTypes.input("Placeholder", 2, 5),
...
```

For TypeScript:

```js
import { formTypes } from 'discord-dashboard';
...

...
  optionType: formTypes.input("Placeholder", 2, 5),
...
```

### Types available

Currently available types are:

#### Spacer
```js
...
    optionType: 'spacer',
    title: 'First spacer',
    description: 'First spacer description.'
...
```

How does a spacer work?

Spacer allows you to create 'subcategories' in categories and possibility to separate its content.

![Spacer](https://cdn.assistants.ga/kw59rn2q)

#### Select
```js
...
  optionType: DBD.formTypes.select(list, disabled),
...
```

**list:** `{ displayName: valueReturned }` - required

**disabled:** Boolean (true/false) - optional

##### Returned data

String: selected item 'valueReturned' value

#### Input
```js
...
  optionType: DBD.formTypes.input(placeholder, min, max, disabled, required),
...
```

**placeholder:** String - optional

**min:** Number (*as min length*) - optional

**max:** Number (*as max length*) - optional

**disabled:** Boolean (true/false) - optional

**required:** Boolean (true/false) - optional

##### Returned data

String

#### Textarea
```js
...
  optionType: DBD.formTypes.textarea(placeholder, min, max, disabled, required),
...
```

**placeholder:** String - optional

**min:** Number - optional (*as min length*)

**max:** Number - optional (*as max length*)

**disabled:** Boolean (true/false) - optional

**required:** Boolean (true/false) - optional

##### Returned data

String

#### Switch
```js
...
  optionType: DBD.formTypes.switch(defaultState, disabled),
...
```

**defaultState:** Boolean (true/false) - optional

**disabled:** Boolean (true/false) - optional

##### Returned data

Boolean (true/false)

#### Color picker
```js
...
  optionType: DBD.formTypes.colorSelect(defaultColor, disabled),
...
```

**defaultColor:** Hex with the # - optional (if not set, will be white #ffffff by default)
**disabled:** Boolean (true/false) - optional

##### Returned data

String (Hex color with the # - for example, #fff000)

#### Guild Channels Select
```js
...
  optionType: DBD.formTypes.channelsSelect(disabled, channelTypes),
...
```

**disabled:** Boolean (true/false) - optional
**channelTypes:** Array of channel types to use - optional, by default `['GUILD_TEXT']`

##### Returned data

String (Channel ID)

#### Guild Roles Select
```js
...
  optionType: DBD.formTypes.rolesSelect(disabled),
...
```

**disabled:** Boolean (true/false) - optional

##### Returned data

String (Role ID)

#### Multiple Guild Channels Select
```js
...
  optionType: DBD.formTypes.channelsMultiSelect(disabled, required, channelTypes),
...
```

**disabled:** Boolean (true/false) - optional
**required:** Boolean (true/false) - optional
**channelTypes:** Array of channel types to use - optional, by default `['GUILD_TEXT']`

##### Returned data

Array (Channels IDs)

#### Multiple Guild Roles Select
```js
...
  optionType: DBD.formTypes.rolesMultiSelect(disabled, required),
...
```

**disabled:** Boolean (true/false) - optional
**required:** Boolean (true/false) - optional

##### Returned data

Array (Roles IDs)

#### Multiple Select
```js
...
  optionType: DBD.formTypes.multiSelect(list, disabled, required),
...
```

**list:** `{ displayName: valueReturned, }` - required
**disabled:** Boolean (true/false) - optional
**required:** Boolean (true/false) - optional

##### Returned data

Array (list of selected valueReturned)

## Custom Pages


Our module also allows you to create Custom Pages. These are pages that are not intended to be closely affiliated with Discord-Dashboard.

```js
const DBD = require('discord-dashboard');
...

...
customPages: [
  optionType: DBD.sendJson('/json-test', ({user}) => {
            return {
                message: 'Hello!',
            };
        })
]
...
```

For TypeScript:

```js
import { customPagesTypes } from 'discord-dashboard';
...

...
customPages: [
  customPagesTypes.sendJson('/json-test', ({user}) => {
            return {
                message: 'Hello!',
            };
        }),
]
...
```

### Types available

There are 3 types of Custom Pages: redirect to another page, custom HTML and JSON Api.

- `endpoint` is stuff after url to your project. For example, `endpoint: '/test/stuff'` will be accessible from the `localhost/test/stuff` URL. Localhost can be also your domain or IP adress.
- `getDataFunction` function is function to get data to return. For redirect, it will be an URL string. For custom HTML, it will be HTML string. For JSON Api, it will be an JSON Object.

#### Redirect

```js
...
DBD.customPagesTypes.redirectToUrl(endpoint: String, getDataFunction: Function<String>),
...
```

#### HTML Render

```js
...
DBD.customPagesTypes.renderHtml(endpoint: String, getDataFunction: Function<String>),
...
```

#### JSON Api

```js
...
DBD.customPagesTypes.sendJson(endpoint: String, getDataFunction: Function<Object>),
...
```

### Custom Pages Usage Example

```js
...
    customPages: [
        DBD.customPagesTypes.redirectToUrl('/redirect-to-foo', ({user}) => {
            if(user.id)return `https://foo.com/?user=${user.id}`;
            return "https://foo.com/?user=false";
        }),
        DBD.customPagesTypes.renderHtml('/html-render', ({user}) => {
            return `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Test</title>
                </head>
                <body>
                    <h1>${user.id ? `Hello, ${user.username}!` : `You are not logged in.`}</h1>
                </body>
            </html>
            `
        }),
        DBD.customPagesTypes.sendJson('/json-test', ({user}) => {
            return {
                error: user.id ? false : true,
                message: user.id ? null : "User not logged in.",
                user: user
            };
        })
    ]
...
```

## Discord

For the proper operation of the panel, you need a few previously mentioned Discord settings. It seems difficult, but it is not.

PS. Don't show this information to ANYONE. They are confidential and only for you.

### How to get

To get all of the required items listed below, you need to:
* Enter the site: https://discord.com/developers/applications
* Create new Application
* Continue for the selected option below:

#### Client ID

* Go to "OAuth2"
* Copy "Client ID"

#### Client Secret

* Go to "OAuth2"
* Copy "Client Secret"

#### Client Bot Token

* Go to "Bot"
* Create Bot
* Copy "TOKEN"

#### Redirect URI

* Go to "OAuth2"
* In place of Redirects, add your domain like http://domain.com/discord/callback or http://localhost/discord/callback (it can also be https, and if the port is other than 80 or 442 you must add it after the domain name [e.g. http://domain.com:245/discord/callback], 'domain.com' equals 'localhost' on local host)
* Save changes
* Redirect URI is this saved URL
