'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';

interface SessionTimeoutProps {
    warningTimeMinutes?: number; // Show warning N minutes before timeout
    timeoutMinutes?: number; // Total session timeout
    onTimeout?: () => void;
}

/**
 * Session Timeout Warning Component
 * P2-10 FIX: Add session timeout warning
 */
export function SessionTimeoutWarning({
    warningTimeMinutes = 5,
    timeoutMinutes = 60,
    onTimeout,
}: SessionTimeoutProps) {
    const [showWarning, setShowWarning] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState(warningTimeMinutes * 60);
    const [lastActivity, setLastActivity] = useState(Date.now());

    const router = useRouter();
    const supabase = getSupabaseClient();

    // Track user activity
    const resetTimer = useCallback(() => {
        setLastActivity(Date.now());
        setShowWarning(false);
        setRemainingSeconds(warningTimeMinutes * 60);
    }, [warningTimeMinutes]);

    // Handle session extension
    const extendSession = useCallback(async () => {
        resetTimer();
        // Refresh the session token
        const { error } = await supabase.auth.refreshSession();
        if (error) {
            console.error('Failed to refresh session:', error);
        }
    }, [resetTimer, supabase.auth]);

    // Handle logout
    const handleLogout = useCallback(async () => {
        await supabase.auth.signOut();
        onTimeout?.();
        router.push('/login?error=Session expired');
    }, [supabase.auth, router, onTimeout]);

    // Monitor activity
    useEffect(() => {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

        events.forEach(event => {
            document.addEventListener(event, resetTimer, { passive: true });
        });

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, resetTimer);
            });
        };
    }, [resetTimer]);

    // Check for timeout
    useEffect(() => {
        const checkTimeout = setInterval(() => {
            const elapsed = Date.now() - lastActivity;
            const elapsedMinutes = elapsed / (1000 * 60);
            const warningThreshold = timeoutMinutes - warningTimeMinutes;

            if (elapsedMinutes >= timeoutMinutes) {
                // Session expired
                clearInterval(checkTimeout);
                handleLogout();
            } else if (elapsedMinutes >= warningThreshold) {
                // Show warning
                setShowWarning(true);
                const remaining = (timeoutMinutes * 60) - (elapsed / 1000);
                setRemainingSeconds(Math.max(0, Math.floor(remaining)));
            }
        }, 1000);

        return () => clearInterval(checkTimeout);
    }, [lastActivity, timeoutMinutes, warningTimeMinutes, handleLogout]);

    if (!showWarning) return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in-95">
                <div className="text-center">
                    <div className="text-5xl mb-4">⏰</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Session Timeout Warning
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Your session will expire in{' '}
                        <span className="font-bold text-red-600">{formatTime(remainingSeconds)}</span>
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                        Click "Stay Logged In" to continue your session.
                    </p>

                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Log Out
                        </button>
                        <button
                            onClick={extendSession}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-600"
                        >
                            Stay Logged In
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SessionTimeoutWarning;
