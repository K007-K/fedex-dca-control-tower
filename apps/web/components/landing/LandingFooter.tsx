import { Lock } from 'lucide-react';
import Link from 'next/link';

import { Wordmark } from './Logo';

const COLUMNS = [
    {
        heading: 'Platform',
        links: [
            { label: 'Governance model', href: '#governance' },
            { label: 'Capabilities', href: '#platform' },
            { label: 'Case lifecycle', href: '#lifecycle' },
            { label: 'Security & compliance', href: '#security' },
        ],
    },
    {
        heading: 'Workbenches',
        links: [
            { label: 'Administrator', href: '#workbenches' },
            { label: 'Manager', href: '#workbenches' },
            { label: 'Agent', href: '#workbenches' },
            { label: 'Auditor', href: '#workbenches' },
        ],
    },
    {
        heading: 'Access',
        links: [
            { label: 'Sign in', href: '/login' },
            { label: 'Forgot password', href: '/forgot-password' },
        ],
    },
];

export function LandingFooter() {
    return (
        <footer className="border-t border-gray-200/80 bg-gray-50/60 dark:border-white/10 dark:bg-white/[0.02]">
            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                <div className="grid gap-10 lg:grid-cols-[1.5fr_2fr]">
                    <div>
                        <Wordmark />
                        <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                            Governance-first management of debt collection operations across
                            agencies, regions and organisational boundaries.
                        </p>
                        <span className="mt-5 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-400">
                            <Lock className="h-3.5 w-3.5" />
                            Internal system · access restricted
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
                        {COLUMNS.map((column) => (
                            <div key={column.heading}>
                                <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-900 dark:text-white">
                                    {column.heading}
                                </h3>
                                <ul className="mt-4 space-y-2.5">
                                    {column.links.map((link) => (
                                        <li key={link.label}>
                                            {link.href.startsWith('#') ? (
                                                <a
                                                    href={link.href}
                                                    className="text-sm text-gray-600 transition-colors hover:text-primary dark:text-gray-400 dark:hover:text-white"
                                                >
                                                    {link.label}
                                                </a>
                                            ) : (
                                                <Link
                                                    href={link.href}
                                                    className="text-sm text-gray-600 transition-colors hover:text-primary dark:text-gray-400 dark:hover:text-white"
                                                >
                                                    {link.label}
                                                </Link>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-12 flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                        © {new Date().getFullYear()} FedEx Corporation. All rights reserved.
                    </p>
                    <p className="font-mono text-xs text-gray-400 dark:text-gray-600">
                        DCA Control Tower · Enterprise Governance Platform
                    </p>
                </div>
            </div>
        </footer>
    );
}
