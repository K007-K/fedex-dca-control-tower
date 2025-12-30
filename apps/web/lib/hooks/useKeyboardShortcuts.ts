'use client';

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    callback: () => void;
    description: string;
}

/**
 * P3-7: Keyboard Shortcuts Hook
 * Global keyboard shortcut manager
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            for (const shortcut of shortcuts) {
                const ctrlMatch = shortcut.ctrl === undefined || shortcut.ctrl === (event.ctrlKey || event.metaKey);
                const metaMatch = shortcut.meta === undefined || shortcut.meta === event.metaKey;
                const shiftMatch = shortcut.shift === undefined || shortcut.shift === event.shiftKey;
                const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

                if (ctrlMatch && metaMatch && shiftMatch && keyMatch) {
                    event.preventDefault();
                    shortcut.callback();
                    break;
                }
            }
        },
        [shortcuts]
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}

// Common shortcuts
export const SHORTCUTS = {
    SEARCH: { key: '/', description: 'Focus search' },
    COMMAND_PALETTE: { key: 'k', ctrl: true, description: 'Open command palette' },
    ESCAPE: { key: 'Escape', description: 'Close modal/dialog' },
    HELP: { key: '?', shift: true, description: 'Show keyboard shortcuts' },
    TOGGLE_SIDEBAR: { key: 'b', ctrl: true, description: 'Toggle sidebar' },
} as const;
