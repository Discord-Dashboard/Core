module.exports = ({fileName, domain, port, token, licenseId, clientSecret, clientId}) => {
    require('fs').writeFileSync(`${fileName}.js`, `

/* --- DISCORD.JS CLIENT --- */

const {Client, Intents} = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
client.login('${token}');

/* --- DASHBOARD THEME & SETTINGS 'DATABASE'  --- */

const DarkDashboard = require('dbd-dark-dashboard');
let langsSettings = {};

/* --- DASHBOARD --- */
(async ()=>{
    let DBD = require('discord-dashboard');
    await DBD.useLicense('${licenseId}');
    DBD.Dashboard = DBD.UpdatedClass();

    const Dashboard = new DBD.Dashboard({
        port: ${port || 80},
        client: {
            id: '${clientId}',
            secret: '${clientSecret}'
        },
        redirectUri: '${domain}/discord/callback',
        domain: '${domain}',
        bot: client,
        theme: DarkDashboard({
            information: {
                createdBy: "Assistants Center",
                websiteTitle: "Assistants Center",
                websiteName: "Discord-Dashboard",
                websiteUrl: "${domain}",
                dashboardUrl: "${domain}",
                supporteMail: "support@${domain}",
                supportServer: "",
                imageFavicon: "https://www.imidnight.ml/assets/img/logo-circular.png",
                iconURL: "https://www.imidnight.ml/assets/img/logo-circular.png",
                pagestylebg: "linear-gradient(to #2CA8FF, pink 0%, #155b8d 100%)",
                main_color: "#2CA8FF",
                sub_color: "#ebdbdb",
            },
            invite: {
                client_id: "[Client ID]",
                redirectUri: "http://localhost:3000/close",
                permissions: "8",
            },
            index: {
                card: {
                    category: "Discord-Dahsboard Panel - The center of everything",
                    title: 'Welcome to the Discord-Dashboard where you can control the core features to the bot.',
                    image: "https://i.imgur.com/axnP93g.png",
                    footer: "Footer",
                },
                information: {
                    category: "Category",
                    title: "Information",
                    description: 'This bot and panel is currently a work in progress so contact me if you find any issues on discord.',
                    footer: "Footer",
                },
                feeds: {
                    category: "Category",
                    title: "Information",
                    description: 'This bot and panel is currently a work in progress so contact me if you find any issues on discord.',
                    footer: "Footer",
                },
            },
            guilds: {
                cardTitle: "Guilds",
                cardDescription: "Here are all the guilds you currenly have permissions for:",
            },
            //If guildSettings is removed the text will not be visible.
            guildSettings: {
                cardTitle: "Guild Settings",
                cardDescription: "Here you can manage all the settings for your guild:",
            },
            commands: {
                categoryOne: {
                    category: 'Starting Up',
                    subTitle: 'All helpful commands',
                    list: [
                        {
                            commandName: "Test command",
                            commandUsage: "prefix.test <arg> [op]",
                            commandDescription: "Lorem ipsum dolor sth",
                            commandAlias: "Alias",
                        },
                        {
                            commandName: "2nd command",
                            commandUsage: "oto.nd <arg> <arg2> [op]",
                            commandDescription: "Lorem ipsum dolor sth, arg sth arg2 stuff",
                            commandAlias: "Alias",
                        },
                        {
                            commandName: "Test command",
                            commandUsage: "prefix.test <arg> [op]",
                            commandDescription: "Lorem ipsum dolor sth",
                            commandAlias: "Alias",
                        },
                    ],
                },
            },
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
                ]
            },
        ]
    });

    Dashboard.init();
})();

       `)
}