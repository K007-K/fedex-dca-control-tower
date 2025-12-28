import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

interface DCA {
    id: string;
    name: string;
    status: string;
    capacity_limit: number;
    capacity_used: number;
    performance_score: number;
    recovery_rate: number;
    specializations: Record<string, unknown> | null;
}

interface Case {
    id: string;
    case_number: string;
    outstanding_amount: number;
    customer_segment: string | null;
    customer_industry: string | null;
    assigned_dca_id: string | null;
}

/**
 * POST /api/cases/allocate - Auto-allocate case to best DCA
 * 
 * Algorithm:
 * 1. Find all active DCAs with available capacity
 * 2. Score each DCA based on:
 *    - Available capacity (40%)
 *    - Performance score (40%)
 *    - Specialization match (20%)
 * 3. Assign to highest scoring DCA
 */
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        const { case_id } = body;

        if (!case_id) {
            return NextResponse.json(
                { error: 'Missing required field: case_id' },
                { status: 400 }
            );
        }

        // Get case details
        const { data: caseData, error: caseError } = await supabase
            .from('cases')
            .select('*')
            .eq('id', case_id)
            .single();

        if (caseError || !caseData) {
            return NextResponse.json(
                { error: 'Case not found' },
                { status: 404 }
            );
        }

        const caseRecord = caseData as Case;

        // Check if already assigned
        if (caseRecord.assigned_dca_id) {
            return NextResponse.json(
                { error: 'Case is already assigned to a DCA' },
                { status: 400 }
            );
        }

        // Get active DCAs with available capacity
        const { data: dcas, error: dcaError } = await supabase
            .from('dcas')
            .select('*')
            .eq('status', 'ACTIVE');

        if (dcaError) {
            throw dcaError;
        }

        // Filter DCAs with available capacity
        const availableDcas = (dcas as DCA[] || []).filter(
            dca => dca.capacity_used < dca.capacity_limit
        );

        if (availableDcas.length === 0) {
            return NextResponse.json(
                { error: 'No DCAs available with capacity' },
                { status: 400 }
            );
        }

        // Score each DCA
        const scoredDcas = availableDcas.map(dca => {
            let score = 0;

            // Capacity score (40%) - Higher available capacity = higher score
            const capacityAvailable = dca.capacity_limit - dca.capacity_used;
            const capacityRatio = capacityAvailable / dca.capacity_limit;
            score += capacityRatio * 40;

            // Performance score (40%)
            score += (dca.performance_score || 0) * 0.4;

            // Specialization match (20%)
            if (dca.specializations) {
                const specs = dca.specializations as { industries?: string[]; segments?: string[] };
                if (specs.industries?.includes(caseRecord.customer_industry || '')) {
                    score += 10;
                }
                if (specs.segments?.includes(caseRecord.customer_segment || '')) {
                    score += 10;
                }
            }

            return { dca, score };
        });

        // Sort by score descending
        scoredDcas.sort((a, b) => b.score - a.score);

        const bestDca = scoredDcas[0].dca;

        // Assign case to best DCA
        const { error: updateError } = await supabase
            .from('cases')
            .update({
                assigned_dca_id: bestDca.id,
                assigned_at: new Date().toISOString(),
                assignment_method: 'AUTO_ALLOCATED',
                status: 'ALLOCATED',
                updated_at: new Date().toISOString(),
            })
            .eq('id', case_id);

        if (updateError) {
            throw updateError;
        }

        // Log the action
        await supabase.from('case_actions').insert({
            case_id: case_id,
            action_type: 'DCA_ASSIGNED',
            action_description: `Case auto-allocated to ${bestDca.name}`,
            old_status: 'PENDING_ALLOCATION',
            new_status: 'ALLOCATED',
        });

        return NextResponse.json({
            message: 'Case allocated successfully',
            data: {
                case_id,
                assigned_dca_id: bestDca.id,
                assigned_dca_name: bestDca.name,
                allocation_score: scoredDcas[0].score.toFixed(2),
                candidates_evaluated: availableDcas.length,
            }
        });

    } catch (error) {
        console.error('Auto-allocation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
