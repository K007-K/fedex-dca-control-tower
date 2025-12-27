import Link from 'next/link';

import { CaseCreateForm } from '@/components/cases/CaseCreateForm';
import { createClient } from '@/lib/supabase/server';

export default async function NewCasePage() {
    const supabase = await createClient();

    // Fetch DCAs for dropdown
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: dcas } = await (supabase as any)
        .from('dcas')
        .select('id, name')
        .eq('status', 'ACTIVE')
        .order('name');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <nav className="flex items-center text-sm text-gray-500 mb-2">
                    <Link href="/cases" className="hover:text-primary">Cases</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900">New Case</span>
                </nav>
                <h1 className="text-2xl font-bold text-gray-900">Create New Case</h1>
                <p className="text-gray-500">Add a new debt collection case to the system</p>
            </div>

            {/* Form */}
            <CaseCreateForm dcas={dcas ?? []} />
        </div>
    );
}
