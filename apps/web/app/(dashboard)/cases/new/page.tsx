import Link from 'next/link';
import { redirect } from 'next/navigation';

import { CaseCreateForm } from '@/components/cases/CaseCreateForm';
import { getCurrentUser } from '@/lib/auth';

export default async function NewCasePage() {
    const user = await getCurrentUser();

    // ============================================================
    // GOVERNANCE: FEDEX_ADMIN ONLY
    // ============================================================
    // Manual case creation is restricted to FEDEX_ADMIN role.
    // All other roles should use SYSTEM integration.
    // ============================================================
    if (!user || user.role !== 'FEDEX_ADMIN') {
        redirect('/cases?error=unauthorized');
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <nav className="flex items-center text-sm text-gray-500 mb-2">
                    <Link href="/cases" className="hover:text-primary">Cases</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900 dark:text-white">New Case</span>
                </nav>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Case</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Manual entry for exceptional scenarios only. DCA assignment is automatic.
                </p>
            </div>

            {/* Form - DCAs prop not needed, DCA selection is SYSTEM-controlled */}
            <CaseCreateForm dcas={[]} />
        </div>
    );
}

