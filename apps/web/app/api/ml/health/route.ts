/**
 * ML Service Health Check
 * 
 * This is a PUBLIC health check endpoint - no auth required
 * It only checks if the ML service is reachable
 */
import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * GET /api/ml/health - Check ML service health
 * PUBLIC endpoint - no authentication required (read-only health status)
 */
export async function GET() {
    try {
        const response = await fetch(`${ML_SERVICE_URL}/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
            const data = await response.json();
            return NextResponse.json({
                status: 'healthy',
                ml_service: data,
            });
        }

        return NextResponse.json(
            { status: 'unhealthy', error: 'ML service not responding' },
            { status: 503 }
        );
    } catch (error) {
        return NextResponse.json(
            { status: 'unhealthy', error: 'ML service unavailable' },
            { status: 503 }
        );
    }
}
