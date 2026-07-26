import { cn } from '@/lib/utils';

import { Reveal } from './Reveal';

interface SectionHeadingProps {
    eyebrow: string;
    title: string;
    description?: string;
    align?: 'left' | 'center';
    className?: string;
}

export function SectionHeading({
    eyebrow,
    title,
    description,
    align = 'left',
    className,
}: SectionHeadingProps) {
    return (
        <Reveal
            className={cn(
                'max-w-3xl',
                align === 'center' && 'mx-auto text-center',
                className
            )}
        >
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-300">
                <span className="h-px w-6 bg-accent" />
                {eyebrow}
            </span>
            <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-tight text-gray-900 sm:text-[42px] dark:text-white">
                {title}
            </h2>
            {description && (
                <p className="mt-4 text-pretty text-[17px] leading-relaxed text-gray-600 dark:text-gray-400">
                    {description}
                </p>
            )}
        </Reveal>
    );
}
