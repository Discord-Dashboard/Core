// apps/dashboard/src/app/api/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { loadAllCategories }        from '@discord-dashboard/form-types'
import {
    GET   as authGET,
    POST  as authPOST,
    PUT   as authPUT,
    DELETE as authDELETE
} from '@discord-dashboard/auth'

import { GET as optionsGET } from './getOptions'

const categoriesPromise = loadAllCategories()

export async function handler(req: NextRequest): Promise<NextResponse> {
    const url   = new URL(req.url)
    const parts = url.pathname.replace(/^\/api/, '').split('/').filter(Boolean)

    if (parts[0] === 'auth') {
        switch (req.method) {
            case 'GET':    return authGET  (req)
            case 'POST':   return authPOST (req)
            case 'PUT':    return authPUT  (req)
            case 'DELETE': return authDELETE(req)
            default:       return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })
        }
    }

    if (req.method === 'GET' && parts[0] === 'test' && parts.length === 1) {
        const categories = await categoriesPromise
        return NextResponse.json(categories.map(cat => cat.serialize()))
    }

    if (req.method === 'GET' && parts[0] === 'options' && parts.length === 2) {
        return optionsGET(req, { params: { guildId: parts[1] } })
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
}

export const GET    = handler
export const POST   = handler
export const PUT    = handler
export const DELETE = handler