import { NextRequest, NextResponse } from 'next/server';
import { serialize } from 'cookie';
import {JWTPayload} from "jose";
import { signJwt, verifyJwt } from "./jwt";

const {
    JWT_SECRET = 'CHANGE_ME',
    COOKIE_NAME = 'dd_auth_token',
    DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET,
    DISCORD_REDIRECT_URI
} = process.env;

const REFRESH_THRESHOLD = 60 * 60; // 1 hour

export async function middleware(req: NextRequest) {
    const cookie = req.cookies.get(COOKIE_NAME)?.value;
    if (!cookie) {
        return NextResponse.redirect(new URL('/api/auth/login', req.url));
    }

    let payload: JWTPayload;
    try {
        console.log("checking payload")
        payload = await verifyJwt(cookie);
    } catch (err) {
        console.error("JWT VERIFY ERROR:", err);
        return NextResponse.redirect(new URL('/api/auth/login', req.url));
    }

    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && now > payload.exp - REFRESH_THRESHOLD) {
        try {
            const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id:     DISCORD_CLIENT_ID!,
                    client_secret: DISCORD_CLIENT_SECRET!,
                    grant_type:    'refresh_token',
                    refresh_token: payload.refresh_token as string,
                })
            }).then(r => r.json());

            if (tokenRes.access_token && tokenRes.expires_in) {
                const newOauthExp = now + tokenRes.expires_in;
                const newRefresh  = tokenRes.refresh_token || payload.refresh_token;

                const newJwt = await signJwt(
                    {
                        sub:    payload.sub,
                        name:     payload.name,
                        refresh_token: newRefresh,
                        exp:       newOauthExp
                    }
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
            return NextResponse.redirect(new URL('/api/auth/login', req.url));
        }
    }

    return NextResponse.next();
}