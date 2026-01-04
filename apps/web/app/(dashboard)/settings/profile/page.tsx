'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Profile Settings page - redirects to main Settings page
 * The profile settings are integrated into the main settings page
 */
export default function ProfilePage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to main settings page which contains profile
        router.replace('/settings');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-gray-500 dark:text-gray-400">
                Redirecting to settings...
            </div>
        </div>
    );
}
