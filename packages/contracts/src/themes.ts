// packages/contracts/src/themes/index.ts
import type React from 'react'

/** Theme names (e.g. 'default', 'dark', 'cyberpunk'). */
export type ThemeName = string

/**
 * Everything a theme can override.
 */
export interface ThemeDefinition {
    /** components to override */
    components: ThemeComponents
    /** arbitrary Next.js routes → page components */
    pages?: Record<string, React.ComponentType<any>>
}

/**
 * Defines all UI components that a theme can override.
 */
export interface ThemeComponents {
    /** The top navigation bar component */
    Navbar?: React.ComponentType<any>
    /** The footer section component */
    Footer?: React.ComponentType<any>
}