declare module 'discord-dashboard' {
    const licenseInfo: () => string | boolean;
    const useLicense: (licenseId: string) => Promise<string>;
    const UpdatedClass: () => Dashboard;

    let Dashboard: any;

    const initDashboard: (options: {fileName: string, domain: string, port: number, token: string, clientSecret: string, clientId: string}) => any;

    const formTypes: formTypes;
    const customPagesTypes: customPagesTypes;

    const version: string;
}

interface Dashboard {
    new(config: {
        port: number,
        client: {
            id: string,
            secret: string
        },
        redirectUri: string,
        domain: string,
        bot: any,
        theme: any,
        settings: category[],
        acceptPrivacyPolicy?: boolean,
        noCreateServer?: boolean,
        SSL?: {
            enabled: boolean,
            key: string,
            cert: string
        },
        minimizedConsoleLog?: boolean,
        invite?: {
            clientId: string,
            scopes: object,
            permissions: string,
            redirectUri: string,
            otherParams: string
        },
        supportServer?: {
            slash: string,
            inviteUrl: string
        },
        guildAfterAuthorization?: {
            use: boolean,
            guildId: string
        },
    }): any;
    DBDEvents: () => any;
    init: () => Promise<any>;
    getApp: () => any;
    useThirdPartyModule: (module: any) => any;
}

interface category {
    categoryId: string,
    categoryName: string,
    categoryDescription: string,
    categoryOptionsList: option[]
}

interface option {
    optionId?: string,
    optionName?: string,
    optionDescription?: string,
    title?: string,
    description?: string,
    optionType: {
        type: string,
        data?: string | null,
        function?: any,
        min?: number | null,
        max?: number | null,
        disabled?: boolean | null,
        required?: boolean | null,
        themeOptions?: object | null
    } | string,
    getActualSet?: (options: optionOptions) => Promise<any>,
    setNew?: (options: optionOptions) => Promise<any>,
    allowedCheck?: (options: allowedCheckOption) => Promise<any>
}

interface optionOptions {
    guild: { id: string },
    user: { id: string },
    newData: any
}

interface allowedCheckOption {
    guild: { id: string },
    user: { id: string }
}

interface formTypes {
    select: (list: object, disabled?: boolean, themeOptions?: object) => {
        type: string,
        data: {
            keys: object,
            values: object
        },
        disabled: boolean,
        themeOptions: object
    };

    multiSelect: (list: object, disabled?: boolean, required?: boolean, themeOptions?: object) => {
        type: string,
        data: {
            keys: object,
            values: object
        },
        disabled: boolean | null,
        required: boolean | null,
        themeOptions: object
    };

    input: (placeholder?: string, min?: number, max?: number, disabled?: boolean, required?: boolean, themeOptions?: object) => {
        type: string,
        data: string | null,
        min: number | null,
        max: number | null,
        disabled: boolean | null,
        required: boolean | null,
        themeOptions: object | null
    };

    textarea: (placeholder?: string, min?: number, max?: number, disabled?: boolean, required?: boolean, themeOptions?: object) => {
        type: string,
        data: string | null,
        min: number | null,
        max: number | null,
        disabled: boolean | null,
        required: boolean | null,
        themeOptions: object | null
    };

    switch: (disabled?: boolean, themeOptions?: object) => {
        type: string,
        disabled: boolean,
        themeOptions: object
    };

    checkbox: (disabled?: boolean, themeOptions?: object) => {
        type: string,
        disabled: boolean,
        themeOptions: object
    };

    channelsSelect: (disabled?: boolean, channelTypes?: string[], themeOptions?: object) => {
        type: string,
        function: (client: string, guildid: string) => any,
        disabled: boolean,
        themeOptions: object
    };

    channelsMultiSelect: (disabled?: boolean, required?: boolean, channelTypes?: string[], themeOptions?: object) => {
        type: string,
        function: (client: string, guildid: string) => any,
        disabled: boolean,
        required: boolean,
        themeOptions: object
    };

    rolesSelect: (disabled?: boolean, themeOptions?: object) => {
        type: string,
        function: (client: string, guildid: string) => any,
        disabled: boolean,
        themeOptions: object
    };

    rolesMultiSelect: (disabled?: boolean, required?: boolean, themeOptions?: object) => {
        type: string,
        function: (client: string, guildid: string) => any,
        disabled: boolean,
        required: boolean,
        themeOptions: object
    };

    colorSelect: (defaultState: string, disabled?: boolean, themeOptions?: object) => {
        type: string,
        data: string,
        disabled: boolean,
        themeOptions: object
    };

    embedBuilder: (defaultSettings: object, themeOptions?: object) => {
        type: string,
        data: object,
        themeOptions: object
    }
}

interface EmbedBuilder {
    content?: string,
    embed: {
        title?: string,
        description: string,
        color?: string | number,
        timestamp?: any,
        url?: string,
        author?: {
            name?: string,
            url?: string,
            icon_url?: string
        },
        thumbnail?: {
            url?: string
        },
        image?: {
            url?: string
        },
        footer?: {
            text?: string,
            icon_url?: string
        },
        fields?: [ EmbedBuilderField ],
    }
}

interface EmbedBuilderField {
    name?: string,
    value?: string,
    inline?: boolean
}

interface customPagesTypes {
    redirectToUrl: (endpoint: string, getDataFunction: any) => {
        type: string,
        endpoint: string,
        getEndpoint: any
    };

    renderHtml: (endpoint: string, getDataFunction: any) => {
        type: string,
        endpoint: string,
        getHtml: any
    };

    sendJson: (endpoint: string, getDataFunction: any) => {
        type: string,
        endpoint: string,
        getJson: any
    };
}