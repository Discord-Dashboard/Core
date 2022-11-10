const { formTypes } = require("discord-dashboard")

const Handler = require(`${__dirname}/../index`)

const ids = []

const err = (text) => {
    return `🐧${text} Do you need help? Join our Discord server: ${
        "https://discord.gg/CzfMGtrdaA".blue
    }`
}

class Option {
    constructor(
        options = {
            optionId: "",
            optionName: "",
            optionDescription: "",
            optionType: formTypes,
        }
    ) {
        //
        this.optionId = options.optionId
        this.optionName = options.optionName
        this.optionDescription = options.optionDescription
        this.optionType = options.optionType

        this.categoryId = "default"

        const db = Handler.getDB()

        this.setNew = async ({ guild, newData }) => {
            await db.set(`${guild.id}.options.${this.optionId}`, newData)
        }

        this.getActualSet = async ({ guild }) => {
            return await db.get(`${guild.id}.options.${this.optionId}`)
        }
    }

    /**
     *
     * @param {string} id - The id of the option, must be unique
     * @returns
     */
    setId(id) {
        this.optionId = id

        if (ids.includes(id))
            throw new Error(err(`Option id ${id} already exists`))
        else ids.push(this.optionId)

        return this
    }

    /**
     *
     * @param {string} name - The name of the option displayed in the dashboard
     * @returns
     */
    setName(name) {
        this.optionName = name

        return this
    }

    /**
     *
     * @param {string} description - The description of the option displayed in the dashboard
     * @returns
     */
    setDescription(description) {
        this.optionDescription = description

        return this
    }

    /**
     *
     * @param {object} options - Set custom options for the formType
     * @returns
     */
    setOptions(options) {
        this.themeOptions = options
    }

    /**
     *
     * @param {formTypes} type - The type of the option
     * @returns
     */
    setType(type) {
        this.optionType = type

        return this
    }
}

module.exports = Option
