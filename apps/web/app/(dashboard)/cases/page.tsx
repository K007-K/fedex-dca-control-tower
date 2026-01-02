import { Suspense } from 'react';
import { cookies } from 'next/headers';

import { CaseFilters, CaseTableWithSelection } from '@/components/cases';
import { Pagination } from '@/components/ui/pagination';
import { secureQuery, type SecureUser } from '@/lib/auth/secure-query';
import { getCurrentUser } from '@/lib/auth';
import { regionRBAC } from '@/lib/region';
import { REGION_COOKIE_NAME } from '@/lib/context/RegionContext';

interface PageProps {
    searchParams: Promise<{
        page?: string;
        search?: string;
        status?: string;
        priority?: string;
        dca_id?: string;
        region?: string;
    }>;
}

async function CasesContent({ searchParams }: { searchParams: PageProps['searchParams'] }) {
    const params = await searchParams;
    const authUser = await getCurrentUser();

    // Read region from cookie (set by sidebar region switcher)
    const cookieStore = await cookies();
    const selectedRegion = cookieStore.get(REGION_COOKIE_NAME)?.value;

    // Redirect if not authenticated
    if (!authUser) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Please log in to view cases.</p>
            </div>
        );
    }

    // Enrich user with accessible regions for SecureQueryBuilder
    const accessibleRegions = await regionRBAC.getUserAccessibleRegions(authUser.id);
    const regionIds = accessibleRegions.map(r => r.region_id);
    const isGlobalAdmin = ['SUPER_ADMIN', 'FEDEX_ADMIN'].includes(authUser.role);

    const user: SecureUser = {
        id: authUser.id,
        email: authUser.email || '',
        role: authUser.role,
        dcaId: authUser.dcaId,
        accessibleRegions: regionIds,
        isGlobalAdmin,
    };

    const page = parseInt(params.page ?? '1');
    const limit = 15;
    const offset = (page - 1) * limit;

    // Determine effective region filter (URL param takes precedence, then cookie)
    const effectiveRegion = params.region || (selectedRegion && selectedRegion !== 'ALL' ? selectedRegion : null);


    // Use SecureQueryBuilder for region-enforced queries
    const queryBuilder = secureQuery(user)
        .from('cases')
        .select('*, region, assigned_dca:dcas(id, name)')
        .withOptions({ regionColumn: 'region' });

    // Add search filter
    if (params.search) {
        queryBuilder.or(`case_number.ilike.%${params.search}%,customer_name.ilike.%${params.search}%`);
    }
    if (params.status) {
        queryBuilder.eq('status', params.status);
    }
    if (params.priority) {
        queryBuilder.eq('priority', params.priority);
    }
    if (params.dca_id) {
        queryBuilder.eq('assigned_dca_id', params.dca_id);
    }
    // Region filter from URL param (overrides user's accessible regions for admins)
    if (effectiveRegion) {
        queryBuilder.eq('region', effectiveRegion);
    }

    // Execute with region filtering
    const { data: cases, error, count } = await queryBuilder
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
        .execute();

    if (error) {
        console.error('Cases fetch error:', error);
    }

    // Fetch DCAs for filter dropdown - also region filtered
    const dcaQueryBuilder = secureQuery(user)
        .from('dcas')
        .select('id, name')
        .eq('status', 'ACTIVE')
        .order('name');

    const { data: dcas } = await dcaQueryBuilder.execute();

    const totalPages = Math.ceil((count ?? 0) / limit);

    // Build search params for pagination
    const currentSearchParams: Record<string, string> = {};
    if (params.search) currentSearchParams.search = params.search;
    if (params.status) currentSearchParams.status = params.status;
    if (params.priority) currentSearchParams.priority = params.priority;
    if (params.dca_id) currentSearchParams.dca_id = params.dca_id;
    if (params.region) currentSearchParams.region = params.region;

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
