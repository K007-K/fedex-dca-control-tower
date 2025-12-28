import Link from 'next/link';
import { notFound } from 'next/navigation';

import { DCAEditForm } from '@/components/dcas/DCAEditForm';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function DCAEditPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: dca, error } = await (supabase as any)
        .from('dcas')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !dca) {
        notFound();
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <nav className="flex items-center text-sm text-gray-500 mb-2">
                    <Link href="/dcas" className="hover:text-primary">DCAs</Link>
                    <span className="mx-2">/</span>
                    <Link href={`/dcas/${id}`} className="hover:text-primary">{dca.name}</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900">Edit</span>
                </nav>
                <h1 className="text-2xl font-bold text-gray-900">Edit DCA</h1>
                <p className="text-gray-500">Update DCA details and settings</p>
            </div>

            {/* Form */}
            <DCAEditForm dca={dca} />
        </div>
    );
}
