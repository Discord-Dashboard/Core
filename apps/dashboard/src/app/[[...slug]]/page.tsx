import type { ReactElement } from 'react'
import { notFound } from 'next/navigation'
import Theme from '@/config/theme'
import type { ThemeDefinition } from '@discord-dashboard/contracts'

export default function CatchAll({
                                     params,
                                 }: {
    params: { slug?: string[] }
}): ReactElement {
    const path = '/' + (params.slug?.join('/') || '')

    const pages = (Theme as ThemeDefinition).pages || {}

    const PageComponent = pages[path]

    if (!PageComponent) {
        return notFound()
    }

    return <PageComponent />
}