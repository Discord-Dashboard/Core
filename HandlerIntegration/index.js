const prefix = "[DBD-Settings-Handler]"
const colors = require("colors")
const Keyv = require("keyv")
const { join } = require("path")

let db

const err = (text) => {
    return `🐧${text} Do you need help? Join our Discord server: ${
        "https://discord.gg/CzfMGtrdaA".blue
    }`
}

class Handler {
    constructor(keyvAdapter) {
        this.Category = require(`${__dirname}/structures/Category`)
        this.Option = require(`${__dirname}/structures/Option`)

        db = new Keyv(
            keyvAdapter || `sqlite://${join(__dirname, "/database.sqlite")}`
        )

        db.on("error", (err) =>
            console.error(`${prefix} ${`Keyv connection error: ${err}`.red}`)
        )

        console.log(`${prefix} Database successfully initialized!`)
    }

    static getDB() {
        if (!db) throw new Error(err("Database not initialized"))

        return db
    }
}

module.exports = Handler
