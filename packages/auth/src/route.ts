import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const {
    DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET,
    DISCORD_REDIRECT_URI,
    JWT_SECRET = 'CHANGE_ME',
    COOKIE_NAME = 'dd_auth_token',
} = process.env;

// 1) build redirect to Discord OAuth2
function loginHandler(req: NextRequest) {
    const state = req.nextUrl.searchParams.get('state') || '';
    const params = new URLSearchParams({
        client_id:     DISCORD_CLIENT_ID!,
        redirect_uri:  DISCORD_REDIRECT_URI!,
        response_type: 'code',
        scope:         'identify guilds',
        state,
    });
    return NextResponse.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
}

// 2) exchange code, fetch user, sign JWT with refresh_token + oauthExp
async function callbackHandler(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code');
    if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });

    // exchange for tokens
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id:     DISCORD_CLIENT_ID!,
            client_secret: DISCORD_CLIENT_SECRET!,
            grant_type:    'authorization_code',
            code,
            redirect_uri:  DISCORD_REDIRECT_URI!,
        })
    }).then(r => r.json());

    if (!tokenRes.access_token || !tokenRes.expires_in) {
        return NextResponse.json({ error: 'Token exchange failed' }, { status: 500 });
    }

    // fetch user info
    const user = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${tokenRes.access_token}` }
    }).then(r => r.json());

    if (!user.id) {
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }

    // calculate OAuth expiry timestamp
    const now = Math.floor(Date.now() / 1000);
    const oauthExp = now + tokenRes.expires_in;

    // sign a long‐lived JWT that embeds refresh token + OAuth expiry
    const jwtToken = jwt.sign(
        {
            discordId:    user.id,
            username:     user.username,
            refreshToken: tokenRes.refresh_token,
            oauthExp,       // UNIX timestamp when access_token expires
        },
        JWT_SECRET,
        { expiresIn: '30d' } // JWT itself lives 30 days
    );

    // set cookie
    const res = NextResponse.redirect(new URL('/', req.url));
    res.headers.append(
        'Set-Cookie',
        serialize(COOKIE_NAME, jwtToken, {
            httpOnly: true,
            path:     '/',
            maxAge:   30 * 24 * 3600,
        })
    );
    return res;
}

// 3) logout: clear cookie
function logoutHandler(req: NextRequest) {
    const res = NextResponse.redirect(new URL('/', req.url));
    res.headers.append(
        'Set-Cookie',
        serialize(COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0 })
    );
    return res;
}

// 4) return user info (no refresh here)
function userHandler(req: NextRequest) {
    const cookie = req.headers.get('cookie') || '';
    const match  = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    if (!match) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    try {
        const payload: any = jwt.verify(match[1], JWT_SECRET);
        return NextResponse.json({ id: payload.discordId, username: payload.username });
    } catch {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
}

// main dispatcher
export async function handler(req: NextRequest) {
    const action = req.nextUrl.pathname.split('/').pop();
    if (req.method === 'GET') {
        if (action === 'login')    return loginHandler(req);
        if (action === 'callback') return callbackHandler(req);
        if (action === 'logout')   return logoutHandler(req);
        if (action === 'user')     return userHandler(req);
    }
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}

export const GET    = handler;
export const POST   = handler;
export const PUT    = handler;
export const DELETE = handler;