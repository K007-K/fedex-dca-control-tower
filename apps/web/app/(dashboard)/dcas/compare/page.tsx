import { createClient } from '@/lib/supabase/server';
import { DCAComparison } from '@/components/dcas/DCAComparison';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function DCAComparePage() {
    const supabase = await createClient();

    // Fetch all active DCAs with their metrics
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: dcas } = await (supabase as any)
        .from('dcas')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('name');

    // Fetch case counts per DCA
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: caseCounts } = await (supabase as any)
        .from('cases')
        .select('assigned_dca_id')
        .not('assigned_dca_id', 'is', null);

    // Count cases per DCA
    const caseCountByDCA: Record<string, number> = {};
    caseCounts?.forEach((c: { assigned_dca_id: string }) => {
        if (c.assigned_dca_id) {
            caseCountByDCA[c.assigned_dca_id] = (caseCountByDCA[c.assigned_dca_id] || 0) + 1;
        }
    });

    // Enrich DCAs with active_cases count
    const enrichedDcas = (dcas || []).map((dca: {
        id: string;
        name: string;
        code: string;
        status: string;
        capacity_limit: number;
        capacity_used: number;
        performance_score: number;
        recovery_rate: number;
        total_recovered: number;
    }) => ({
        ...dca,
        active_cases: caseCountByDCA[dca.id] || 0,
    }));

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Compare DCAs</h1>
                    <p className="text-gray-500">Select DCAs to compare performance side by side</p>
                </div>
                <Link href="/dcas">
                    <Button variant="outline">← Back to DCAs</Button>
                </Link>
            </div>

            {enrichedDcas.length >= 2 ? (
                <DCAComparison dcas={enrichedDcas} />
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Not Enough DCAs</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                        You need at least 2 active DCAs to use the comparison feature.
                    </p>
                    <Link href="/dcas/new" className="inline-block mt-4">
                        <Button>+ Add DCA</Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
