import { Client, GatewayIntentBits } from 'discord.js'

let clientPromise: Promise<Client> | null = null

export async function getDiscordClient(): Promise<Client> {
    if (!clientPromise) {
        const client = new Client({ intents: [GatewayIntentBits.Guilds] })

        clientPromise = client.login(process.env.DISCORD_BOT_TOKEN as string)
            .then(() => {
                return client
            })
            .catch((err) => {
                throw err
            })
    }

    return clientPromise
}