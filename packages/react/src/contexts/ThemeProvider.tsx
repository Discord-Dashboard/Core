'use client'

import React, { createContext, useContext } from 'react'
import type { ThemeDefinition } from '@discord-dashboard/contracts'

const ThemeConfig = createContext<ThemeDefinition['config']>({})

export function ThemeProvider({ children, config }: { children: React.ReactNode, config: ThemeDefinition["config"] }) {
    return (
        <ThemeConfig.Provider value={config}>
            {children}
        </ThemeConfig.Provider>
    )
}

export function useThemeConfig() {
    return useContext(ThemeConfig)
}
