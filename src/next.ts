import { NextRequest, NextResponse } from 'next/server'

export async function handler(req: NextRequest): Promise<NextResponse> {
    const url = new URL(req.url);
    const parts = url.pathname.replace(/^\/api/, '').split('/').filter(Boolean);

    if (req.method === 'GET' && parts[0] === 'test' && parts.length === 1) {
        return NextResponse.json({ message: 'This is a test response' });
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}

// Next.js App Router expects these exports
export const GET    = handler;
export const POST   = handler;
export const PUT    = handler;
export const DELETE = handler;