import { Suspense } from 'react';

import { CaseFilters, CaseTableWithSelection } from '@/components/cases';
import { Pagination } from '@/components/ui/pagination';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
    searchParams: Promise<{
        page?: string;
        search?: string;
        status?: string;
        priority?: string;
        dca_id?: string;
    }>;
}

async function CasesContent({ searchParams }: { searchParams: PageProps['searchParams'] }) {
    const params = await searchParams;
    const supabase = await createClient();

    const page = parseInt(params.page ?? '1');
    const limit = 15;
    const offset = (page - 1) * limit;

    // Build query with filters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
        .from('cases')
        .select('*, assigned_dca:dcas(id, name)', { count: 'exact' });

    if (params.search) {
        query = query.or(`case_number.ilike.%${params.search}%,customer_name.ilike.%${params.search}%`);
    }
    if (params.status) {
        query = query.eq('status', params.status);
    }
    if (params.priority) {
        query = query.eq('priority', params.priority);
    }
    if (params.dca_id) {
        query = query.eq('assigned_dca_id', params.dca_id);
    }

    query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    const { data: cases, count, error } = await query;

    if (error) {
        console.error('Cases fetch error:', error);
    }

    // Fetch DCAs for filter dropdown and bulk assignment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: dcas } = await (supabase as any)
        .from('dcas')
        .select('id, name')
        .eq('status', 'ACTIVE')
        .order('name');

    const totalPages = Math.ceil((count ?? 0) / limit);

    // Build search params for pagination
    const currentSearchParams: Record<string, string> = {};
    if (params.search) currentSearchParams.search = params.search;
    if (params.status) currentSearchParams.status = params.status;
    if (params.priority) currentSearchParams.priority = params.priority;
    if (params.dca_id) currentSearchParams.dca_id = params.dca_id;

    return (
        <>
            <CaseFilters dcas={dcas ?? []} />
            <CaseTableWithSelection cases={cases ?? []} dcas={dcas ?? []} />
            <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={count ?? 0}
                itemsPerPage={limit}
                baseUrl="/cases"
                searchParams={currentSearchParams}
            />
        </>
    );
}

function CasesLoading() {
    return (
        <div className="space-y-6">
            {/* Filters skeleton */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-10 bg-gray-100 dark:bg-[#1a1a1a] rounded-md animate-pulse" />
                    ))}
                </div>
            </div>
            {/* Table skeleton */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4">
                <div className="space-y-3">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-50 dark:bg-[#1a1a1a] rounded animate-pulse" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default async function CasesPage({ searchParams }: PageProps) {
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cases</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage and track all debt collection cases</p>
                </div>
                <a
                    href="/cases/new"
                    className="inline-flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Case
                </a>
            </div>

            <Suspense fallback={<CasesLoading />}>
                <CasesContent searchParams={searchParams} />
            </Suspense>
        </div>
    );
}
