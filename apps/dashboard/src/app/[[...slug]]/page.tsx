import { notFound } from 'next/navigation'
import { match as createMatcher, MatchFunction } from 'path-to-regexp'
import Theme from '@/config/theme'
import type { ThemeDefinition } from '@discord-dashboard/contracts'

type PageEntry = {
    matcher: MatchFunction<Record<string, string>>
    Component: React.ComponentType<{ params: Record<string, string> }>
}

const entries: PageEntry[] = Object.entries((Theme as ThemeDefinition).pages || {})
    .map(([pattern, Component]) => ({
        matcher: createMatcher(pattern, { decode: decodeURIComponent }),
        Component,
    }))

export default async function CatchAll({
                                           params,
                                       }: {
    params: Promise<{ slug?: string[] }>
}) {
    const { slug } = await params

    const path = slug && slug.length > 0
        ? '/' + slug.join('/')
        : '/'

    for (const { matcher, Component } of entries) {
        const m = matcher(path)
        if (m) {
            return <Component params={m.params} />
        }
    }

    return notFound()
}