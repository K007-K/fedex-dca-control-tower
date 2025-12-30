import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import '@/styles/globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { OfflineBanner } from '@/components/offline/OfflineBanner';
import { Providers } from '@/components/Providers';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

export const metadata: Metadata = {
    title: {
        default: 'FedEx DCA Control Tower',
        template: '%s | FedEx DCA Control Tower',
    },
    description:
        'Enterprise-grade Debt Collection Agency Management System for FedEx. Monitor, manage, and optimize debt recovery operations across 500+ DCAs globally.',
    keywords: [
        'FedEx',
        'DCA',
        'Debt Collection',
        'Control Tower',
        'Enterprise',
        'Recovery Management',
    ],
    authors: [{ name: 'FedEx' }],
    robots: {
        index: false,
        follow: false,
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#4D148C' },
        { media: '(prefers-color-scheme: dark)', color: '#1F2937' },
    ],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Inline script to prevent theme flash - runs before React hydrates
    const themeScript = `
        (function() {
            try {
                var stored = localStorage.getItem('theme');
                var theme = stored || 'system';
                var resolved = theme;
                if (theme === 'system') {
                    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.classList.remove('light', 'dark');
                document.documentElement.classList.add(resolved);
                document.documentElement.style.colorScheme = resolved;
            } catch (e) {}
        })();
    `;

    return (
        <html lang="en" className={inter.variable} suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeScript }} />
            </head>
            <body className="min-h-screen bg-background font-sans antialiased">
                <ThemeProvider>
                    <QueryProvider>
                        <OfflineBanner />
                        <Providers>
                            {children}
                        </Providers>
                    </QueryProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}

