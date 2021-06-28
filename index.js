const DBD = require('../index');

let langsSettings = {};

let currencyNames = {};

let botNicknames = {};

const Discord = require('discord.js');
const client = new Discord.Client();
client.login("ODQ5OTcyMTg4Nzg2MDY1NDU4.YLi8SQ.Id9WvV00ooQ3guuZ8vjwd7DbiAg");

const Dashboard = new DBD.Dashboard({
    port: 80,
    client: {
        id: '849972188786065458',
        secret: 'kXdMw965B2pGjj9ozrG47YDj0qo25jEo'
    },
    redirectUri: 'http://localhost/discord/callback',
    domain: 'http://localhost',
    bot: client,
    settings: [
        {
            categoryId: 'setup',
            categoryName: "Setup",
            categoryDescription: "Setup your bot with default settings!",
            categoryOptionsList: [
                {
                    optionId: 'channel',
                    optionName: "Channel",
                    optionDescription: "Channel input select sth lol",
                    optionType: DBD.formTypes.channelsSelect(),
                    getActualSet: async ({guild}) => {
                        return channel[guild.id] || null;
                    },
                    setNew: async ({guild,newData}) => {
                        channel[guild.id] = newData;
                        return;
                    }
                },
                {
                    optionId: 'nickname',
                    optionName: "Nickname",
                    optionDescription: "Bot's nickname on the guild",
                    optionType: DBD.formTypes.channelsSelect(false),
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
