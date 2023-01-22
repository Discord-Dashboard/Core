const prefix = "[DBD-Storage-Handler]"
const colors = require("colors")
const Keyv = require("keyv")
const { join } = require("path")

const err = (text) => {
    return `🐧${text} Do you need help? Join our Discord server: ${"https://discord.gg/CzfMGtrdaA".blue
        }`
}

class Handler {
    constructor(keyvAdapter) {
        this.db = new Keyv(
            keyvAdapter || `sqlite://${join(__dirname, "/database.sqlite")}`
        )

        this.db.on("error", (err) =>
            console.error(`${prefix} ${`Keyv connection error: ${err}`.red}`)
        )

        this.Category = require(`${__dirname}/structures/Category`)(this.db)
        this.Option = require(`${__dirname}/structures/Option`)(this.db)

        console.log(`${prefix} Database successfully initialized!`)
    }

    async fetch(guildId, optionId) {
        return await this.db.get(`${guildId}.options.${optionId}`)
    }

    db() {
        return this.db
    }
}

module.exports = Handler
