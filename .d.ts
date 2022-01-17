declare module 'discord-dashboard' {
    const licenseInfo: () => string | boolean;
    const useLicense: (licenseId: string) => Promise<string>;
    const UpdatedClass: () => Dashboard;

    const initDashboard: (options: {fileName: string, domain: string, port: number, token: string, clientSecret: string, clientId: string}) => any;

    const formTypes: any;
    const customPagesTypes: any;

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
    optionId: string,
    optionName: string,
    optionDescription: string,
    optionType: any,
    getActualSet: (options: optionOptions) => Promise<any>,
    setNew: (options: optionOptions) => Promise<any>,
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