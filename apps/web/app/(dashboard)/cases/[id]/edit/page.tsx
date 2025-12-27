import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CaseEditForm } from '@/components/cases/CaseEditForm';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function CaseEditPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch case details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: caseData, error } = await (supabase as any)
        .from('cases')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !caseData) {
        notFound();
    }

    // Fetch DCAs for dropdown
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: dcas } = await (supabase as any)
        .from('dcas')
        .select('id, name')
        .eq('status', 'ACTIVE')
        .order('name');

    // Fetch agents for dropdown
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: agents } = await (supabase as any)
        .from('users')
        .select('id, full_name')
        .in('role', ['DCA_AGENT', 'DCA_MANAGER', 'FEDEX_ANALYST'])
        .eq('is_active', true)
        .order('full_name');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <nav className="flex items-center text-sm text-gray-500 mb-2">
                    <Link href="/cases" className="hover:text-primary">Cases</Link>
                    <span className="mx-2">/</span>
                    <Link href={`/cases/${id}`} className="hover:text-primary">{caseData.case_number}</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900">Edit</span>
                </nav>
                <h1 className="text-2xl font-bold text-gray-900">Edit Case</h1>
                <p className="text-gray-500">Update case details and assignment</p>
            </div>

            {/* Form */}
            <CaseEditForm
                caseData={caseData}
                dcas={dcas ?? []}
                agents={agents ?? []}
            />
        </div>
    );
}
