import type React from 'react'

import type { Metadata } from 'next'

export type ThemeName = string

export interface ThemeDefinition {
    pages?: Record<string, React.ComponentType<any>>
    metadata?: Record<string, Metadata>
    config?: Record<string, any>
}