module.exports = ({fileName, domain, port, token, clientSecret, clientId}) => {
    require('fs').writeFileSync(`${fileName}.js`, `
const DBD = require('discord-dashboard');
const CaprihamTheme = require('dbd-capriham-theme');

let langsSettings = {};
let currencyNames = {};

const Discord = require('discord.js');
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });
client.login(${token});

const Dashboard = new DBD.Dashboard({
    minimizedConsoleLogs: false,
    port: ${port},
    client: {
        id: "${clientId}",
        secret: "${clientSecret}"
    },
    redirectUri: \`${domain}${port == 80 || port == 443 ? '' : `:${port}`}/discord/callback\`,
    domain: "${domain}",
    bot: client,
    ownerIDs: [],
    theme: CaprihamTheme({
        privacypolicy: {
            websitename: "Assistants",
            websiteurl: "${domain}",
            supportemail: "support@" + "${domain}"
        },
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
                        return; /*return {error: 'String'};*/
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

Dashboard.init();`)
}