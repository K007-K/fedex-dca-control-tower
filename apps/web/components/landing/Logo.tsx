import { cn } from '@/lib/utils';

/**
 * Control Tower mark — a governance shield wrapped around a radar sweep.
 * Shield = enforced boundaries, radar = live oversight.
 */
export function LogoMark({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
            className={cn('h-9 w-9', className)}
        >
            <defs>
                <linearGradient id="ct-mark" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#7A2DB9" />
                    <stop offset="0.55" stopColor="#4D148C" />
                    <stop offset="1" stopColor="#FF6600" />
                </linearGradient>
            </defs>
            <path
                d="M16 2.5 27 7v8.2c0 6.9-4.5 11.9-11 14.3-6.5-2.4-11-7.4-11-14.3V7L16 2.5Z"
                fill="url(#ct-mark)"
            />
            <path
                d="M16 2.5 27 7v8.2c0 6.9-4.5 11.9-11 14.3-6.5-2.4-11-7.4-11-14.3V7L16 2.5Z"
                stroke="white"
                strokeOpacity="0.22"
                strokeWidth="1"
            />
            <circle cx="16" cy="15.5" r="2.1" fill="white" />
            <path
                d="M11.4 15.5a4.6 4.6 0 0 1 4.6-4.6"
                stroke="white"
                strokeOpacity="0.85"
                strokeWidth="1.4"
                strokeLinecap="round"
            />
            <path
                d="M8 15.5A8 8 0 0 1 16 7.5"
                stroke="white"
                strokeOpacity="0.5"
                strokeWidth="1.4"
                strokeLinecap="round"
            />
        </svg>
    );
}

export function Wordmark({ className }: { className?: string }) {
    return (
        <div className={cn('flex items-center gap-2.5', className)}>
            <LogoMark />
            <span className="flex flex-col leading-none">
                <span className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white">
                    DCA Control Tower
                </span>
                <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-gray-500 dark:text-gray-500">
                    FedEx Governance Platform
                </span>
            </span>
        </div>
    );
}
