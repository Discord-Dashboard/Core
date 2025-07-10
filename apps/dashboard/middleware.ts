import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware, config } from '@discord-dashboard/auth'

export default function middleware(req: NextRequest) {
    return authMiddleware(req)
}

export const matcher = config.matcher