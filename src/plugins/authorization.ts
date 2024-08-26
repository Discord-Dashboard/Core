import type { FastifyPluginAsync } from 'fastify';
import errors from 'throw-http-errors';
import ErrorCodes from '@discord-dashboard/typings/dist/Core/ErrorCodes';

import type { User } from '@discord-dashboard/typings/dist/User';
import type { Config } from '@discord-dashboard/typings/dist/Config';

import fp from 'fastify-plugin';

import FastifyCookie from '@fastify/cookie';
import FastifySession, { SessionStore } from '@fastify/session';

import DiscordOauth2 from 'discord-oauth2';

declare module 'fastify' {
    interface Session {
        back?: string;
        user?: User;
        tokens?: DiscordOauth2.TokenRequestResult;
    }
}

const AuthorizationPlugin: FastifyPluginAsync<{
    api_config: Config['api'];
    store?: SessionStore;
}> = async (fastify, opts) => {
    await fastify.register(FastifyCookie);
    await fastify.register(FastifySession, {
        secret: opts.api_config.session.secret,
        cookie: {
            secure: opts.api_config.protocol === 'https',
        },
        store: opts.store,
    });
};

const authMiddleware = async (request: any, reply: any) => {
    if (!request.session.tokens || !request.session.user) {
        throw new errors.Unauthorized(null, ErrorCodes.UNAUTHORIZED);
    }
};

export default fp(AuthorizationPlugin, {
    name: 'authorization',
});

export { authMiddleware };
