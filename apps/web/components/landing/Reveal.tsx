'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface RevealProps {
    children: ReactNode;
    /** Stagger delay in ms. */
    delay?: number;
    className?: string;
}

/**
 * Dependency-free scroll reveal. Content is visible by default for users with
 * reduced motion or without IntersectionObserver — never hides content on failure.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        const reduced =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // A hidden document never delivers IntersectionObserver callbacks, so a page
        // opened in a background tab would stay invisible. Nothing is animating for
        // anyone to see there — just show it.
        if (
            reduced ||
            typeof IntersectionObserver === 'undefined' ||
            document.visibilityState === 'hidden'
        ) {
            setShown(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShown(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '0px 0px -12% 0px', threshold: 0.05 }
        );

        observer.observe(node);

        // Safety net: never leave content stranded if the observer goes quiet.
        const onHide = () => {
            if (document.visibilityState === 'hidden') setShown(true);
        };
        document.addEventListener('visibilitychange', onHide);

        return () => {
            observer.disconnect();
            document.removeEventListener('visibilitychange', onHide);
        };
    }, []);

    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className={cn(
                'transition-[opacity,transform] duration-700 ease-out',
                shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
                'motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none',
                className
            )}
        >
            {children}
        </div>
    );
}
