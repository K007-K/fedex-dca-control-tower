import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import '@/styles/globals.css';
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
    return (
        <html lang="en" className={inter.variable} suppressHydrationWarning>
            <body className="min-h-screen bg-background font-sans antialiased">
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}

