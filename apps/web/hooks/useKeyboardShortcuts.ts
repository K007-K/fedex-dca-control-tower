'use client';

import { useEffect } from 'react';

interface KeyboardShortcut {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    action: () => void;
    description: string;
}

/**
 * Keyboard Shortcuts Hook
 * P3-3 FIX: Add keyboard shortcuts for power users
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Ignore shortcuts when typing in inputs
            const target = event.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                return;
            }

            for (const shortcut of shortcuts) {
                const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
                const ctrlMatch = shortcut.ctrlKey ? (event.ctrlKey || event.metaKey) : true;
                const altMatch = shortcut.altKey ? event.altKey : !event.altKey;
                const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;

                if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
                    event.preventDefault();
                    shortcut.action();
                    return;
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts]);
}

/**
 * Common shortcuts configuration
 */
export function useGlobalShortcuts() {
    const shortcuts: KeyboardShortcut[] = [
        {
            key: '/',
            description: 'Focus search',
            action: () => {
                const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
                searchInput?.focus();
            },
        },
        {
            key: 'g',
            description: 'Go to dashboard',
            action: () => {
                window.location.href = '/dashboard';
            },
        },
        {
            key: 'c',
            description: 'Go to cases',
            action: () => {
                window.location.href = '/cases';
            },
        },
        {
            key: 'a',
            description: 'Go to analytics',
            action: () => {
                window.location.href = '/analytics';
            },
        },
        {
            key: 'n',
            description: 'Go to notifications',
            action: () => {
                window.location.href = '/notifications';
            },
        },
        {
            key: '?',
            shiftKey: true,
            description: 'Show keyboard shortcuts',
            action: () => {
                // Could open a modal showing all shortcuts
                console.log('Keyboard shortcuts help');
            },
        },
        {
            key: 'Escape',
            description: 'Close modal/dialog',
            action: () => {
                // Close any open modals
                const closeButton = document.querySelector<HTMLButtonElement>('[data-close-modal]');
                closeButton?.click();
            },
        },
    ];

    useKeyboardShortcuts(shortcuts);

    return shortcuts;
}

export default useKeyboardShortcuts;
