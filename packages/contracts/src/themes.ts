// packages/contracts/src/themes/index.ts
import type React from 'react'

/** Theme names (e.g. 'default', 'dark', 'cyberpunk'). */
export type ThemeName = string

export interface PageMetadata {
    title?: string;
    description?: string;
}

/**
 * Everything a theme can override.
 */
export interface ThemeDefinition {
    /** arbitrary Next.js routes → page components */
    pages?: Record<string, React.ComponentType<any>>
    /** arbitrary Next.js routes → page components */
    metadata?: Record<string, PageMetadata>
    /** metadata */
    config?: Record<string, any>
}