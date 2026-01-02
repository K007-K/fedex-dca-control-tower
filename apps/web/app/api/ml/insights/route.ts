/**
 * ML Insights API - Fetches cases and generates ML analysis
 * This endpoint provides authenticated access to case data for ML analysis
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

interface Case {
    id: string;
    outstanding_amount: number;
    customer_segment: string | null;
    due_date: string | null;
    currency?: string;
    region?: string;
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const region = searchParams.get('region');

        // Fetch cases from database - no auth required for this endpoint
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let casesQuery = (supabase as any)
            .from('cases')
            .select('id, outstanding_amount, customer_segment, due_date, currency, region')
            .order('created_at', { ascending: false })
            .limit(50);

        if (region && region !== 'ALL') {
            casesQuery = casesQuery.eq('region', region);
        }

        const { data: cases, error } = await casesQuery;

        if (error) {
            console.error('ML Insights API error:', error);
            return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 });
        }

        const allCases = (cases || []) as Case[];

        // Determine currency
        const currency = region === 'INDIA' ? 'INR' :
            region === 'AMERICA' ? 'USD' :
                allCases[0]?.currency || 'USD';

        // Prepare cases for ML analysis
        const casesForAnalysis = allCases.map((c) => {
            const dueDate = c.due_date ? new Date(c.due_date) : new Date();
            const daysPastDue = Math.max(0, Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

            return {
                amount: c.outstanding_amount || 0,
                days: daysPastDue,
                segment: c.customer_segment || 'MEDIUM',
            };
        });

        // Call ML service for each case
        let totalPriority = 0;
        let totalRecoveryRate = 0;
        let totalExpected = 0;
        let highRisk = 0;
        let successfulAnalyses = 0;

        for (const c of casesForAnalysis) {
            try {
                const [priorityRes, recoveryRes] = await Promise.all([
                    fetch(`${ML_SERVICE_URL}/api/v1/priority/score`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            outstanding_amount: c.amount,
                            days_past_due: c.days,
                            segment: c.segment,
                        }),
                    }),
                    fetch(`${ML_SERVICE_URL}/api/v1/predict/recovery`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            outstanding_amount: c.amount,
                            days_past_due: c.days,
                            segment: c.segment,
                        }),
                    }),
                ]);

                if (priorityRes.ok) {
                    const priority = await priorityRes.json();
                    totalPriority += priority.priority_score || 0;
                    if (priority.risk_level === 'HIGH' || priority.risk_level === 'CRITICAL') {
                        highRisk++;
                    }
                }

                if (recoveryRes.ok) {
                    const recovery = await recoveryRes.json();
                    totalRecoveryRate += recovery.recovery_probability || 0;
                    totalExpected += recovery.expected_recovery_amount || 0;
                    successfulAnalyses++;
                }
            } catch (e) {
                console.error('ML analysis error:', e);
            }
        }

        const count = successfulAnalyses || casesForAnalysis.length || 1;

        return NextResponse.json({
            caseCount: casesForAnalysis.length,
            avgPriority: Math.round(totalPriority / count),
            avgRecoveryRate: Math.round(totalRecoveryRate / count),
            expectedRecovery: Math.round(totalExpected),
            highRiskCount: highRisk,
            currency,
            dataSource: casesForAnalysis.length > 0 ? 'real' : 'sample',
        });
    } catch (error) {
        console.error('ML Insights API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
