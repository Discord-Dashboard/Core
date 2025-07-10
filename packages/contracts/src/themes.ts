// packages/contracts/src/themes/index.ts
import type React from 'react'

/** Theme names (e.g. 'default', 'dark', 'cyberpunk'). */
export type ThemeName = string

/**
 * Everything a theme can override.
 */
export interface ThemeDefinition {
    /** arbitrary Next.js routes → page components */
    pages?: Record<string, React.ComponentType<any>>
    /** metadata */
    config?: Record<string, any>
}