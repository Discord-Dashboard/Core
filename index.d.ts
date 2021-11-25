declare module "discord-dashboard" {
	/** The Dashboard to handler our express app and its configurations
	 * @link https://assistants.ga/dbd-docs/#/?id=documentation
	 */
	class Dashboard {
		public constructor(config: config_options) {}
		/** Function that starts our express session and dashboard. */
		public init?: () => void;
		/** A private function that handles the application middleware. */
		private secretInit: () => void;
	}
	/** Form functions to manage data and states within the dashboard
	 * @link https://assistants.ga/dbd-docs/#/?id=option-types
	 */
	class formTypes {
		/**
		 * The select function. Allows the user to select a value from the response params
		 *
		 * @param list A list of data you enter as a string array
		 * @example {"Polish": 'pl', "English": 'en', "Spanish": 'es'}
		 * @param disabled if the select button should be disabled or not.
		 * @returns
		 */
		public static select(
			list:
				| {
						[s: string]: unknown;
				  }
				| ArrayLike<unknown>,
			disabled: boolean
		): {
			type: string;
			data: {
				keys: string[];
				values: unknown[];
			};
			disabled: boolean;
		};
		/**
		 * Similar to the select function but allows for more than one item in the list to be selected.
		 * @param list A list of data you enter as a string array
		 * @example {"Polish": 'pl', "English": 'en', "Spanish": 'es'}
		 * @param disabled If the list is disabled
		 * @param required if the list is disabled from user interaction
		 * @returns
		 */
		public static multiSelect(
			list:
				| {
						[s: string]: unknown;
				  }
				| ArrayLike<unknown>,
			disabled: boolean,
			required: boolean
		): {
			type: string;
			data: {
				keys: string[];
				values: unknown[];
			};
			disabled: boolean;
			required: boolean;
		};
		/**
		 * Allows for text based input in the form of a text input field
		 * @param placeholder the text to display if non was entered
		 * @param min the minimum text allowed in the input field
		 * @param max  the maximum text allowed in the input field
		 * @param disabled if the input field is disabled
		 * @param required if the input field is required
		 * @returns
		 */
		public static input(
			placeholder: string,
			min: number,
			max: number,
			disabled: boolean,
			required: boolean
		): {
			type: string;
			data: string;
			min: number | null;
			max: number | null;
			disabled: boolean;
			required: boolean;
		};
		/**
		 * Similar to input but allows for multi line text.
		 * @param placeholder the text to display if non was entered
		 * @param min the minimum text allowed in the input field
		 * @param max  the maximum text allowed in the input field
		 * @param disabled if the input field is disabled
		 * @param required if the input field is required
		 * @returns
		 */
		public static textarea(
			placeholder: string,
			min: number,
			max: number,
			disabled: boolean,
			required: boolean
		): {
			type: string;
			data: string;
			min: number | null;
			max: number | null;
			disabled: boolean;
			required: boolean;
		};
		/**
		 * A simple function to control button fields and there states
		 * @param defaultState the default state for the switch
		 * @param disabled if the state is disabled
		 * @returns
		 */
		public static switch(
			defaultState: boolean,
			disabled: Boolean
		): {
			type: string;
			data: boolean;
			disabled: Boolean;
		};
		/**
		 * A function to filter through the client cache and find all text based channels and returns them by channel name
		 * @param disabled if the state is disabled
		 * @param channelTypes the type of channel to filter through.  default is GUILD_TEXT
		 * @returns
		 */
		public static channelsSelect(
			disabled: boolean,
			channelTypes?: discordjs_channel_types
		): {
			type: string;
			function: (
				client: {
					guilds: {
						cache: {
							get: (arg0: any) => {
								(): any;
								new (): any;
								channels: {
									(): any;
									new (): any;
									cache: {
										type: string;
										name: string | number;
										id: any;
									}[];
								};
							};
						};
					};
				},
				guildId: any
			) => {
				values: unknown[];
				keys: string[];
			};
			disabled: boolean;
		};
		/**
		 * Similar to channelSelect but allows for more channels
		 * @param disabled if the state is disabled
		 * @param required if the state is required
		 * @param channelTypes the type of channel to filter through.  default is GUILD_TEXT
		 * @returns
		 */
		public static channelsMultiSelect(
			disabled: boolean,
			required: boolean,
			channelTypes?: string[]
		): {
			type: string;
			function: (
				client: {
					guilds: {
						cache: {
							get: (arg0: any) => {
								(): any;
								new (): any;
								channels: {
									(): any;
									new (): any;
									cache: any[];
								};
							};
						};
					};
				},
				guildid: any
			) => {
				values: unknown[];
				keys: string[];
			};
			disabled: boolean;
			required: boolean;
		};
		/**
		 * Allows selection of roles from the client and guild cache
		 * @param disabled if the state is disabled
		 * @returns
		 */
		public static rolesSelect(disabled: boolean): {
			type: string;
			function: (
				client: {
					guilds: {
						cache: {
							get: (arg0: any) => {
								(): any;
								new (): any;
								roles: {
									(): any;
									new (): any;
									cache: any[];
								};
							};
						};
					};
				},
				guildid: any
			) => {
				values: unknown[];
				keys: string[];
			};
			disabled: boolean;
		};
		/**
		 * Similar to roleSelect but allows multi selection of roles from the client and guild cache.
		 * @param disabled if the state is disabled
		 * @param required if the state is required
		 * @returns
		 */
		public static rolesMultiSelect(
			disabled: boolean,
			required: boolean
		): {
			type: string;
			function: (
				client: {
					guilds: {
						cache: {
							get: (arg0: any) => {
								(): any;
								new (): any;
								roles: {
									(): any;
									new (): any;
									cache: any[];
								};
							};
						};
					};
				},
				guildid: any
			) => {
				values: unknown[];
				keys: string[];
			};
			disabled: boolean;
			required: boolean;
		};
		/**
		 * Allows users to enter a hex color
		 * @param defaultState the default color if non is given
		 * @param disabled  if the state is disabled
		 * @returns
		 */
		public static colorSelect(
			defaultState: boolean,
			disabled: boolean
		): {
			type: string;
			data: boolean;
			disabled: boolean;
		};
		/**
		 * custom page functions
		 */
		public static customPagesTypes(): {
			/**
			 * handles express endpoint redirects
			 * @param endpoint the slash to a new page
			 * @param getDataFunction
			 * @returns
			 */
			redirectToUrl(
				endpoint: any,
				getDataFunction: any
			): {
				type: string;
				endpoint: any;
				getEndpoint: any;
			};
			/**
			 * Render new html to your selected endpoint/page
			 * @param endpoint the slash to a new page
			 * @param getDataFunction
			 * @returns
			 */
			renderHtml(
				endpoint: any,
				getDataFunction: any
			): {
				type: string;
				endpoint: any;
				getHtml: any;
			};
			/**
			 * send json data to the express endpoint
			 * @param endpoint the slash to a new page
			 * @param getDataFunction
			 * @returns
			 */
			sendJson(
				endpoint: any,
				getDataFunction: any
			): {
				type: string;
				endpoint: any;
				getJson: any;
			};
		};
	}
}

/** Base config options for the Dashboard constructor. */
interface config_options {
	/** The port to host your express server on. */
	port: number;
	client: client_field_options;
	/** Your Discord bot class.
	 */
	bot: any;
	/** This is the URl to complete discord authentication
	 * @example
	 * http://localhost:3000/discord/callback
	 * @link https://discord.com/developers/applications/clientid/oauth2/general
	 */
	redirectUri: string;
	/** The domain to host your dashboard using express
	 * 	@example
	 *  https://localhost:3000
	 */
	domain: string;
	acceptPrivacyPolicy: boolean;
	/** A list of admin Id's that can bypass the maintenance page and more. */
	ownerIDs: string[];
	/** Stores the express user data on the local machine. */
	sessionFileStore: boolean;
	/** The invite button config. All this data must be correct as it will be passed into the discord Oauth invite Url. */
	invite: {
		/** Where to send the user after inviting the bot to there server. */
		redirectUri: string;
		/** What permissions to give the bot using this invite link.
		 * You can check the permission number using:
		 * @link https://discordapi.com/permissions.html
		 */
		permissions: number;
		/** Your bot Id */
		clientId: string;
		/** Authorization Scopes. Only bot is needed by default
		 * @example
		 * ["guilds", "bot", "identify"]
		 */
		scopes: string[];
		otherParams: string;
	};
	noCreateServer: boolean;
	/** Support server configuration */
	supportServer: {
		/** The url for the redirect link */
		slash: string;
		/** The link to you discord support server.
		 * @link https://discord.com/invite/N79DZsm3m2
		 */
		inviteUrl: string;
	};
	/** Guild auth configuration. Forces a user to join your support server after authentication. */
	guildAfterAuthorization: {
		/** Should this be enabled? */
		use: boolean;
		/** Your guild/server Id */
		guildId: string;
	};
	/** The password to access the under maintenance page */
	underMaintenanceAccessKey?: string;
	/** A path to the custom under maintenance page html*/
	underMaintenanceAccessPage?: string;
	/** Should the maintenance page be rendered/enabled*/
	useUnderMaintenance?: boolean;
	/** The maintenance page configuration*/
	underMaintenance?: under_maintenance_options;
	/** The core CSS / Display handler
	 *
	 * TODO Add types and not use type any
	 */
	theme: any;
	/** The settings configuration */
	settings: settings_options;
}

/** Client field options */
type client_field_options = {
	/** Your discord bot Id
	 * @link https://discord.com/developers/applications
	 */
	id: string;
	/** Your discord bot secret
	 * @link https://discord.com/developers/applications
	 */
	secret: string;
};

/** Discord Channel types. These are not all the channel types from discord.js
 * @see https://discord.js.org/#/docs/main/stable/typedef/ChannelType
 */
type discordjs_channel_types = [
	| "GUILD_TEXT"
	| "GUILD_VOICE"
	| "GUILD_CATEGORY"
	| "GUILD_NEWS"
	| "GUILD_STORE"
	| "GUILD_NEWS_THREAD"
	| "GUILD_PUBLIC_THREAD"
	| "GUILD_PRIVATE_THREAD"
	| "GUILD_STAGE_VOICE"
];

/** Types for the maintenance pages and its configurations*/
type under_maintenance_options = {
	/** The maintenance page title */
	title: string;
	contentTitle: string;
	/** The text to set for the maintenance page content.
	 * @returns html
	 */
	texts: string[];
	/** CSS stylings for the maintenance page
	 *
	 * @example
	 *
	 * ["#ffa191", "#ffc247"]
	 * @returns hex color values
	 */
	bodyBackgroundColors: string[];
	buildingsColor: string;
	craneDivBorderColor: string;
	craneArmColor: string;
	craneWeightColor: string;
	outerCraneColor: string;
	craneLineColor: string;
	craneCabinColor: string;
	craneStandColors: string[];
};

/** The settings are the main components of the dashboard
 *  They help control dynamic data without the GUI and its functions
 *
 * There are many different types of setting options and more can be found:
 *
 * @link https://assistants.ga/dbd-docs/#/?id=documentation
 *
 */
type settings_options = [
	{
		/** The ID of the settings category. Must be all lowercase and only numbers or letters. (a-z, 0-9). The ID may also appear in the page URL.  */
		categoryId: string;
		/** The category name is displayed as the TAB name on the settings page. */
		categoryName: string;
		/** The basic theme doesn't include this, but some may. This is a description of a section and its settings. */
		categoryDescription: string;
		/** This is a list of all the options that can be put into a category. These are the options we call settings and want to change them.
		 * TODO make it so you can have more than one object in types without using @ts-ignore
		 */
		categoryOptionsList: [
			{
				/**  It's a option ID. Ideally with basic characters (a-z, 0-9) to avoid bugs. The ID may also appear in the page URL. */
				optionId: string;
				/** That's the name of the option. It always appears in the settings TAB. */
				optionName: string;
				/** That's the description of the option. It always appears in the settings TAB. */
				optionDescription: string;
				/** This is very important because this is what defines the way data is received. Whether it should be textInput, input, selectBox or ToogleSwitch. You will establish it here.
				 * @link https://assistants.ga/dbd-docs/#/?id=option-types
				 *
				 * TODO add function types
				 */
				optionType: any;
				/**
				 * It's an async function that is going to give us the data that is currently set to be able to display on the website.
				 * Think of this as a render function. It only fetches past data and does not edit old state.
				 * @link https://assistants.ga/dbd-docs/#/?id=options
				 *
				 * @example
				 * getActualSet: ({ guild }) => {};
				 */
				getActualSet: ({ guild }: any) => Promise<any>;
				/**
				 * This is an async/normal function that we call whenever someone changes the settings of this Option.
				 * This function only acts as a POST request to our backend and does not change data on its own. You still need a database to save the state yourself.
				 * @link https://assistants.ga/dbd-docs/#/?id=options
				 *
				 * @example
				 * getActualSet: ({ guild, newData }) => {};
				 */
				setNew: ({ guild, newData }: any) => Promise<any>;
			}
		];
	}
]; 
