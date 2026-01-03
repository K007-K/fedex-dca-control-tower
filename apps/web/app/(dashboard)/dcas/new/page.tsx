import Link from 'next/link';
import { redirect } from 'next/navigation';

import { DCACreateForm } from '@/components/dcas/DCACreateForm';
import { getCurrentUser } from '@/lib/auth';

export default async function NewDCAPage() {
    const user = await getCurrentUser();

    // ============================================================
    // GOVERNANCE: SUPER_ADMIN or FEDEX_ADMIN ONLY
    // ============================================================
    // DCA onboarding is a governance function restricted to administrative roles.
    // ============================================================
    if (!user || !['SUPER_ADMIN', 'FEDEX_ADMIN'].includes(user.role)) {
        redirect('/dcas?error=unauthorized');
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <nav className="flex items-center text-sm text-gray-500 mb-2">
                    <Link href="/dcas" className="hover:text-primary">DCAs</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900 dark:text-white">New DCA</span>
                </nav>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New DCA</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Onboard a new debt collection agency as a governed partner
                </p>
            </div>

            {/* Governance Context Banner */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Governed Partner Onboarding</h3>
                        <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                            DCAs are onboarded as governed partners. Case allocation is automated by SYSTEM
                            based on performance, capacity, and SLA rules. Performance metrics are calculated
                            automatically and cannot be manually set.
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <DCACreateForm />
        </div>
    );
}

