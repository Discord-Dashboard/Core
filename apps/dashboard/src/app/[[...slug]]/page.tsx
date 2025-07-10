import { notFound } from 'next/navigation'
import Theme from '@/config/theme'
import type { ThemeDefinition } from '@discord-dashboard/contracts'

export default async function CatchAll({
                                           params,
                                       }: {
    params: Promise<{ slug?: string[] }>
}) {
    const { slug } = await params

    const path = slug && slug.length > 0 ? '/' + slug.join('/') : '/'

    const PageComponent = (Theme as ThemeDefinition).pages?.[path]
    if (!PageComponent) return notFound()

    return <PageComponent />
}