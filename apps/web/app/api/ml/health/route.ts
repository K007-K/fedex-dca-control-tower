/**
 * ML Service Health Check Proxy
 */
import { NextResponse } from 'next/server';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export async function GET() {
    try {
        const response = await fetch(`${ML_SERVICE_URL}/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
            const data = await response.json();
            return NextResponse.json({
                ...data,
                proxy: 'next.js',
                ml_service_url: ML_SERVICE_URL,
            });
        }

        return NextResponse.json(
            { status: 'unhealthy', error: 'ML service returned error' },
            { status: 503 }
        );
    } catch (error) {
        console.error('ML health check error:', error);
        return NextResponse.json(
            { status: 'offline', error: 'Cannot connect to ML service' },
            { status: 503 }
        );
    }
}
