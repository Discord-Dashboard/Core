import './globals.css';

import { ReactNode } from 'react';
import { Contexts } from "@discord-dashboard/react";
import { AuthProvider } from "@discord-dashboard/auth";

import Theme from '@/config/theme'

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <Contexts.ThemeProvider config={Theme.config}>
                {children}
            </Contexts.ThemeProvider>
        </AuthProvider>
    );
}