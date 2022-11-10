declare module "discord-dashboard" {
    const licenseInfo: () => string | boolean
    const useLicense: (licenseId: string) => Promise<string>
    const UpdatedClass: () => Dashboard

    let Dashboard: any

    const initDashboard: (options: {
        fileName: string
        domain: string
        port: number
        token: string
        clientSecret: string
        clientId: string
    }) => any

    const formTypes: formTypes
    const customPagesTypes: customPagesTypes
    const DISCORD_FLAGS: {
        Permissions: Permissions
    }

    const version: string
}

interface Permissions {
    CREATE_INSTANT_INVITE: ["CREATE_INSTANT_INVITE", 0x1]
    KICK_MEMBERS: ["KICK_MEMBERS", 0x2]
    BAN_MEMBERS: ["BAN_MEMBERS", 0x4]
    ADMINISTRATOR: ["ADMINISTRATOR", 0x8]
    MANAGE_CHANNELS: ["MANAGE_CHANNELS", 0x10]
    MANAGE_GUILD: ["MANAGE_GUILD", 0x20]
    ADD_REACTIONS: ["ADD_REACTIONS", 0x40]
    VIEW_AUDIT_LOG: ["VIEW_AUDIT_LOG", 0x80]
    PRIORITY_SPEAKER: ["PRIORITY_SPEAKER", 0x100]
    STREAM: ["STREAM", 0x200]
    VIEW_CHANNEL: ["VIEW_CHANNEL", 0x400]
    SEND_MESSAGES: ["SEND_MESSAGES", 0x800]
    SEND_TTS_MESSAGES: ["SEND_TTS_MESSAGES", 0x1000]
    MANAGE_MESSAGES: ["MANAGE_MESSAGES", 0x2000]
    EMBED_LINKS: ["EMBED_LINKS", 0x4000]
    ATTACH_FILES: ["ATTACH_FILES", 0x8000]
    READ_MESSAGE_HISTORY: ["READ_MESSAGE_HISTORY", 0x10000]
    MENTION_EVERYONE: ["MENTION_EVERYONE", 0x20000]
    USE_EXTERNAL_EMOJIS: ["USE_EXTERNAL_EMOJIS", 0x40000]
    VIEW_GUILD_INSIGHTS: ["VIEW_GUILD_INSIGHTS", 0x80000]
    CONNECT: ["CONNECT", 0x100000]
    SPEAK: ["SPEAK", 0x200000]
    MUTE_MEMBERS: ["MUTE_MEMBERS", 0x400000]
    DEAFEN_MEMBERS: ["DEAFEN_MEMBERS", 0x800000]
    MOVE_MEMBERS: ["MOVE_MEMBERS", 0x1000000]
    USE_VAD: ["USE_VAD", 0x2000000]
    CHANGE_NICKNAME: ["CHANGE_NICKNAME", 0x4000000]
    MANAGE_NICKNAMES: ["MANAGE_NICKNAMES", 0x8000000]
    MANAGE_ROLES: ["MANAGE_ROLES", 0x10000000]
    MANAGE_WEBHOOKS: ["MANAGE_WEBHOOKS", 0x20000000]
    MANAGE_EMOJIS_AND_STICKERS: ["MANAGE_EMOJIS_AND_STICKERS", 0x40000000]
    USE_APPLICATION_COMMANDS: ["USE_APPLICATION_COMMANDS", 0x80000000]
    REQUEST_TO_SPEAK: ["REQUEST_TO_SPEAK", 0x100000000]
    MANAGE_EVENTS: ["MANAGE_EVENTS", 0x200000000]
    MANAGE_THREADS: ["MANAGE_THREADS", 0x400000000]
    CREATE_PUBLIC_THREADS: ["CREATE_PUBLIC_THREADS", 0x800000000]
    CREATE_PRIVATE_THREADS: ["CREATE_PRIVATE_THREADS", 0x1000000000]
    USE_EXTERNAL_STICKERS: ["USE_EXTERNAL_STICKERS", 0x2000000000]
    SEND_MESSAGES_IN_THREADS: ["SEND_MESSAGES_IN_THREADS", 0x4000000000]
    START_EMBEDDED_ACTIVITIES: ["START_EMBEDDED_ACTIVITIES", 0x8000000000]
    MODERATE_MEMBERS: ["MODERATE_MEMBERS", 0x10000000000]
}

interface RateLimitSettingsObject {
    windowMs: Number
    max: Number
    message: String
    store?: any
}

interface Dashboard {
    new (config: {
        port: number
        client: {
            id: string
            secret: string
        }
        redirectUri: string
        domain: string
        bot: any
        theme: any
        settings: category[]
        requiredPermissions?: object
        acceptPrivacyPolicy?: boolean
        noCreateServer?: boolean
        SSL?: {
            enabled: boolean
            key: string
            cert: string
        }
        minimizedConsoleLog?: boolean
        rateLimits?: {
            manage?: RateLimitSettingsObject
            guildPage?: RateLimitSettingsObject
            settingsUpdatePostAPI?: RateLimitSettingsObject
            discordOAuth2?: RateLimitSettingsObject
        }
        invite?: {
            clientId: string
            scopes: object
            permissions: string
            redirectUri: string
            otherParams: string
        }
        supportServer?: {
            slash: string
            inviteUrl: string
        }
        guildAfterAuthorization?: {
            use: boolean
            guildId: string
            options?: {
                nickname?: string
                roles?: [string]
                mute?: boolean
                deaf?: boolean
            }
        }
        reportError?: (where: string, what: any) => any
        assistantsSecureStorageKey?: string
    }): any
    DBDEvents: () => any
    init: () => Promise<any>
    getApp: () => any
    useThirdPartyModule: (module: any) => any
}

interface category {
    categoryId: string
    categoryName: string
    categoryDescription: string
    categoryOptionsList: option[]
}

interface option {
    optionId?: string
    optionName?: string
    optionDescription?: string
    title?: string
    description?: string
    optionType:
        | {
              type: string
              data?: string | null
              function?: any
              min?: number | null
              max?: number | null
              disabled?: boolean | null
              required?: boolean | null
              themeOptions?: object | null
          }
        | string
    getActualSet?: (options: optionOptions) => Promise<any>
    setNew?: (options: optionOptions) => Promise<any>
    allowedCheck?: (options: allowedCheckOption) => Promise<any>
    themeOptions?: Object
}

interface optionOptions {
    guild: { id: string }
    user: { id: string }
    newData: any
}

interface allowedCheckOption {
    guild: { id: string }
    user: { id: string }
}

interface formTypes {
    select: (
        list: object,
        disabled?: boolean,
        themeOptions?: object
    ) => {
        type: string
        data: {
            keys: object
            values: object
        }
        disabled: boolean
        themeOptions: object
    }

    multiSelect: (
        list: object,
        disabled?: boolean,
        required?: boolean,
        themeOptions?: object
    ) => {
        type: string
        data: {
            keys: object
            values: object
        }
        disabled: boolean | null
        required: boolean | null
        themeOptions: object
    }

    input: (
        placeholder?: string,
        min?: number,
        max?: number,
        disabled?: boolean,
        required?: boolean,
        themeOptions?: object
    ) => {
        type: string
        data: string | null
        min: number | null
        max: number | null
        disabled: boolean | null
        required: boolean | null
        themeOptions: object | null
    }

    textarea: (
        placeholder?: string,
        min?: number,
        max?: number,
        disabled?: boolean,
        required?: boolean,
        themeOptions?: object
    ) => {
        type: string
        data: string | null
        min: number | null
        max: number | null
        disabled: boolean | null
        required: boolean | null
        themeOptions: object | null
    }

    switch: (
        disabled?: boolean,
        themeOptions?: object
    ) => {
        type: string
        disabled: boolean
        themeOptions: object
    }

    checkbox: (
        disabled?: boolean,
        themeOptions?: object
    ) => {
        type: string
        disabled: boolean
        themeOptions: object
    }

    channelsSelect: (
        disabled?: boolean,
        channelTypes?: string[],
        hideNSFW?: boolean,
        onlyNSFW?: boolean,
        themeOptions?: object
    ) => {
        type: string
        function: (client: string, guildid: string) => any
        disabled: boolean
        themeOptions: object
    }

    channelsMultiSelect: (
        disabled?: boolean,
        required?: boolean,
        channelTypes?: string[],
        hideNSFW?: boolean,
        onlyNSFW?: boolean,
        themeOptions?: object
    ) => {
        type: string
        function: (client: string, guildid: string) => any
        disabled: boolean
        required: boolean
        themeOptions: object
    }

    rolesSelect: (
        disabled?: boolean,
        includeBots: boolean,
        themeOptions?: object
    ) => {
        type: string
        function: (client: string, guildid: string) => any
        disabled: boolean
        themeOptions: object
    }

    rolesMultiSelect: (
        disabled?: boolean,
        required?: boolean,
        includeBots: boolean,
        themeOptions?: object
    ) => {
        type: string
        function: (client: string, guildid: string) => any
        disabled: boolean
        required: boolean
        themeOptions: object
    }

    colorSelect: (
        defaultState: string,
        disabled?: boolean,
        themeOptions?: object
    ) => {
        type: string
        data: string
        disabled: boolean
        themeOptions: object
    }

    embedBuilder: (
        defaultSettings: object,
        themeOptions?: object
    ) => {
        type: string
        data: object
        themeOptions: object
    }
}

interface EmbedBuilder {
    content?: string
    embed: {
        title?: string
        description: string
        color?: string | number
        timestamp?: any
        url?: string
        author?: {
            name?: string
            url?: string
            icon_url?: string
        }
        thumbnail?: {
            url?: string
        }
        image?: {
            url?: string
        }
        footer?: {
            text?: string
            icon_url?: string
        }
        fields?: EmbedBuilderField[]
    }
}

interface EmbedBuilderField {
    name?: string
    value?: string
    inline?: boolean
}

interface customPagesTypes {
    redirectToUrl: (
        endpoint: string,
        getDataFunction: any
    ) => {
        type: string
        endpoint: string
        getEndpoint: any
    }

    renderHtml: (
        endpoint: string,
        getDataFunction: any
    ) => {
        type: string
        endpoint: string
        getHtml: any
    }

    sendJson: (
        endpoint: string,
        getDataFunction: any
    ) => {
        type: string
        endpoint: string
        getJson: any
    }
}
