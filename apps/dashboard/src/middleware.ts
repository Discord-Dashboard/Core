import { NextRequest } from 'next/server'
import {middleware as AuthMiddleware} from '@discord-dashboard/auth'

export default function middleware(req: NextRequest) {
    return AuthMiddleware(req)
}

export const config = {
    matcher: ['/api/options/:path*'],
}