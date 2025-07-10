import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const {
    JWT_SECRET = 'CHANGE_ME',
    COOKIE_NAME = 'dd_auth_token',
    DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET,
    DISCORD_REDIRECT_URI
} = process.env;

// threshold in seconds before actual expiry to trigger a refresh
const REFRESH_THRESHOLD = 60 * 60; // 1 hour

export async function middleware(req: NextRequest) {
    const cookie = req.cookies.get(COOKIE_NAME)?.value;
    if (!cookie) {
        return NextResponse.redirect(new URL('/api/auth/login', req.url));
    }

    let payload: any;
    try {
        // ignore JWT expiry because we control it separately
        payload = jwt.verify(cookie, JWT_SECRET, { ignoreExpiration: true });
    } catch {
        // bad signature or malformed
        return NextResponse.redirect(new URL('/api/auth/login', req.url));
    }

    const now = Math.floor(Date.now() / 1000);

    // if OAuth token is near expiry, refresh it automatically
    if (payload.oauthExp && now > payload.oauthExp - REFRESH_THRESHOLD) {
        try {
            const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id:     DISCORD_CLIENT_ID!,
                    client_secret: DISCORD_CLIENT_SECRET!,
                    grant_type:    'refresh_token',
                    refresh_token: payload.refreshToken as string,
                })
            }).then(r => r.json());

            if (tokenRes.access_token && tokenRes.expires_in) {
                const newOauthExp = now + tokenRes.expires_in;
                const newRefresh  = tokenRes.refresh_token || payload.refreshToken;

                // re-sign JWT with updated tokens
                const newJwt = jwt.sign(
                    {
                        discordId:    payload.discordId,
                        username:     payload.username,
                        refreshToken: newRefresh,
                        oauthExp:       newOauthExp
                    },
                    JWT_SECRET,
                    { expiresIn: '30d' }
                );

                const res = NextResponse.next();
                res.headers.append(
                    'Set-Cookie',
                    serialize(COOKIE_NAME, newJwt, {
                        httpOnly: true,
                        path:     '/',
                        maxAge:   30 * 24 * 3600
                    })
                );
                return res;
            }
        } catch {
            // fallback: force re-login
            return NextResponse.redirect(new URL('/api/auth/login', req.url));
        }
    }

    // all good: proceed
    return NextResponse.next();
}

export const matcher = ['/settings/:path*'];