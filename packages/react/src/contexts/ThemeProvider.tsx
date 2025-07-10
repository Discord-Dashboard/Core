'use client'

import React, { createContext, useContext } from 'react'
import type { ThemeDefinition } from '@discord-dashboard/contracts'

const ThemeComponents = createContext<ThemeDefinition['components']>({})
const ThemePages      = createContext<NonNullable<ThemeDefinition['pages']>>({})

export function ThemeProvider({ children, theme }: { children: React.ReactNode, theme: ThemeDefinition }) {
    const def: ThemeDefinition = theme

    return (
        <ThemeComponents.Provider value={def.components}>
            <ThemePages.Provider value={def.pages || {}}>
                {children}
            </ThemePages.Provider>
        </ThemeComponents.Provider>
    )
}

export function useThemeComponents() {
    return useContext(ThemeComponents)
}
export function useThemePages() {
    return useContext(ThemePages)
}
