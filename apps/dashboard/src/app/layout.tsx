import './global.css';
import { ReactNode } from 'react';
import { Contexts } from "@discord-dashboard/react";
import { AuthProvider } from "@discord-dashboard/auth";

import Theme from '@/config/theme'

export const metadata = {
    title: 'Dashboard',
    description: 'Your Discord Dashboard'
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body className="bg-gray-50 text-gray-900">
                <AuthProvider>
                    <Contexts.ThemeProvider theme={Theme}>
                        {children}
                    </Contexts.ThemeProvider>
                </AuthProvider>
            </body>
        </html>
    );
}