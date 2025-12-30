'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items?: BreadcrumbItem[];
    homeLabel?: string;
    className?: string;
}

/**
 * Breadcrumb Navigation Component
 * P2-8 FIX: Add breadcrumb navigation to all pages
 */
export function Breadcrumb({
    items,
    homeLabel = 'Dashboard',
    className = '',
}: BreadcrumbProps) {
    const pathname = usePathname();

    // Auto-generate breadcrumbs from pathname if not provided
    const breadcrumbItems: BreadcrumbItem[] = items || generateBreadcrumbs(pathname, homeLabel);

    if (breadcrumbItems.length <= 1) return null;

    return (
        <nav aria-label="Breadcrumb" className={`text-sm ${className}`}>
            <ol className="flex items-center gap-2">
                {breadcrumbItems.map((item, index) => {
                    const isLast = index === breadcrumbItems.length - 1;

                    return (
                        <li key={index} className="flex items-center gap-2">
                            {index > 0 && (
                                <svg
                                    className="w-4 h-4 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            )}
                            {isLast || !item.href ? (
                                <span className="text-gray-900 font-medium">
                                    {item.label}
                                </span>
                            ) : (
                                <Link
                                    href={item.href}
                                    className="text-gray-500 hover:text-gray-700 hover:underline"
                                >
                                    {item.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

/**
 * Generate breadcrumbs from pathname
 */
function generateBreadcrumbs(pathname: string, homeLabel: string): BreadcrumbItem[] {
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length === 0) {
        return [{ label: homeLabel }];
    }

    const items: BreadcrumbItem[] = [
        { label: homeLabel, href: '/dashboard' },
    ];

    let currentPath = '';
    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        currentPath += `/${segment}`;

        // Skip if it's 'dashboard' (already added as home)
        if (segment === 'dashboard' && i === 0) continue;

        // Format label
        const label = formatSegment(segment);

        // Last item doesn't need href
        if (i === segments.length - 1) {
            items.push({ label });
        } else {
            items.push({ label, href: currentPath });
        }
    }

    return items;
}

/**
 * Format URL segment to readable label
 */
function formatSegment(segment: string): string {
    // Check if it's a UUID (detail page)
    if (/^[0-9a-f-]{36}$/i.test(segment)) {
        return 'Details';
    }

    // Handle common segments
    const labelMap: Record<string, string> = {
        dcas: 'DCAs',
        sla: 'SLA',
        mfa: 'MFA',
    };

    if (labelMap[segment.toLowerCase()]) {
        return labelMap[segment.toLowerCase()];
    }

    // Convert kebab-case to Title Case
    return segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export default Breadcrumb;
