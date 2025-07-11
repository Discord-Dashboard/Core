import {SignJWT, jwtVerify, JWTPayload} from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const issuer = 'discord-dashboard';

export async function signJwt(payload: JWTPayload): Promise<string> {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setIssuer(issuer)
        .setExpirationTime('30d')
        .sign(secret);
}

export async function verifyJwt(token: string): Promise<any> {
    const { payload } = await jwtVerify(token, secret, { issuer });
    return payload;
}