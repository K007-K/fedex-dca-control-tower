'use client';

import { useEffect, useState, useCallback } from 'react';

interface SLATimerProps {
    dueDate: string;
    slaType?: string;
    onBreach?: () => void;
    className?: string;
}

interface TimeRemaining {
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
    isBreached: boolean;
    urgencyLevel: 'normal' | 'warning' | 'critical' | 'breached';
}

/**
 * Real-time SLA Timer Component
 * P1-8 FIX: Shows live countdown to SLA due date with urgency indicators
 */
export function SLATimer({ dueDate, slaType, onBreach, className = '' }: SLATimerProps) {
    const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
    const [hasNotifiedBreach, setHasNotifiedBreach] = useState(false);

    const calculateTimeRemaining = useCallback((): TimeRemaining => {
        const now = new Date();
        const due = new Date(dueDate);
        const diffMs = due.getTime() - now.getTime();
        const totalSeconds = Math.floor(diffMs / 1000);

        const isBreached = totalSeconds <= 0;
        const absTotalSeconds = Math.abs(totalSeconds);

        const hours = Math.floor(absTotalSeconds / 3600);
        const minutes = Math.floor((absTotalSeconds % 3600) / 60);
        const seconds = absTotalSeconds % 60;

        // Determine urgency level
        let urgencyLevel: TimeRemaining['urgencyLevel'] = 'normal';
        if (isBreached) {
            urgencyLevel = 'breached';
        } else if (totalSeconds <= 3600) { // <= 1 hour
            urgencyLevel = 'critical';
        } else if (totalSeconds <= 14400) { // <= 4 hours
            urgencyLevel = 'warning';
        }

        return {
            hours,
            minutes,
            seconds,
            totalSeconds,
            isBreached,
            urgencyLevel,
        };
    }, [dueDate]);

    useEffect(() => {
        // Initial calculation
        setTimeRemaining(calculateTimeRemaining());

        // Update every second
        const interval = setInterval(() => {
            const remaining = calculateTimeRemaining();
            setTimeRemaining(remaining);

            // Notify on breach (once)
            if (remaining.isBreached && !hasNotifiedBreach && onBreach) {
                setHasNotifiedBreach(true);
                onBreach();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [calculateTimeRemaining, hasNotifiedBreach, onBreach]);

    if (!timeRemaining) {
        return <span className={className}>Loading...</span>;
    }

    const formatNumber = (n: number) => n.toString().padStart(2, '0');

    // Color classes based on urgency
    const colorClasses = {
        normal: 'text-green-600 bg-green-50',
        warning: 'text-orange-600 bg-orange-50',
        critical: 'text-red-600 bg-red-50 animate-pulse',
        breached: 'text-red-700 bg-red-100',
    };

    const iconByUrgency = {
        normal: '⏱️',
        warning: '⚠️',
        critical: '🚨',
        breached: '❌',
    };

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${colorClasses[timeRemaining.urgencyLevel]} ${className}`}>
            <span>{iconByUrgency[timeRemaining.urgencyLevel]}</span>
            <span className="font-mono">
                {timeRemaining.isBreached ? '-' : ''}
                {formatNumber(timeRemaining.hours)}:{formatNumber(timeRemaining.minutes)}:{formatNumber(timeRemaining.seconds)}
            </span>
            {slaType && (
                <span className="text-xs opacity-75">
                    {slaType.replace(/_/g, ' ')}
                </span>
            )}
        </div>
    );
}

/**
 * Compact SLA Timer for table cells
 */
export function SLATimerCompact({ dueDate, className = '' }: { dueDate: string; className?: string }) {
    const [remaining, setRemaining] = useState<string>('');
    const [urgency, setUrgency] = useState<string>('text-gray-600');

    useEffect(() => {
        const update = () => {
            const now = new Date();
            const due = new Date(dueDate);
            const diffMs = due.getTime() - now.getTime();
            const totalSeconds = Math.floor(diffMs / 1000);

            if (totalSeconds <= 0) {
                const hours = Math.floor(Math.abs(totalSeconds) / 3600);
                setRemaining(`-${hours}h overdue`);
                setUrgency('text-red-600 font-semibold');
            } else if (totalSeconds <= 3600) {
                const mins = Math.floor(totalSeconds / 60);
                setRemaining(`${mins}m left`);
                setUrgency('text-red-600 animate-pulse');
            } else if (totalSeconds <= 14400) {
                const hours = Math.floor(totalSeconds / 3600);
                setRemaining(`${hours}h left`);
                setUrgency('text-orange-600');
            } else {
                const hours = Math.floor(totalSeconds / 3600);
                setRemaining(`${hours}h left`);
                setUrgency('text-green-600');
            }
        };

        update();
        const interval = setInterval(update, 60000); // Update every minute for compact view
        return () => clearInterval(interval);
    }, [dueDate]);

    return <span className={`${urgency} ${className}`}>{remaining}</span>;
}

export default SLATimer;
