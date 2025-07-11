import Theme from '@/config/theme'
import type { ThemeDefinition } from '@discord-dashboard/contracts'
import { match as createMatcher } from 'path-to-regexp'
import type { Metadata } from "next";
import { notFound } from 'next/navigation'

type Entry = {
    matcher: ReturnType<typeof createMatcher>
    Component: React.ComponentType<any>
    pattern: string
}

const entries: Entry[] = Object.entries((Theme as ThemeDefinition).pages || {})
    .map(([pattern, Component]) => ({
        matcher: createMatcher(pattern, { decode: decodeURIComponent }),
        Component,
        pattern,
    }))

export async function generateMetadata({
                                           params,
                                       }: {
    params: Promise<{ slug?: string[] }>
}): Promise<Metadata | undefined | null> {
    const { slug } = await params
    const slugArr = slug || []
    const path = slugArr.length ? '/' + slugArr.join('/') : '/'

    for (const { matcher, pattern } of entries) {
        if (matcher(path)) {
            return (Theme as ThemeDefinition).metadata?.[pattern] ?? {}
        }
    }

    return (Theme as ThemeDefinition).metadata?.["404"] || { title: "404 - Not Found" }
}

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

    const NotFoundPage = (Theme as ThemeDefinition).pages?.['404'];
    return NotFoundPage ? <NotFoundPage /> : notFound();
}