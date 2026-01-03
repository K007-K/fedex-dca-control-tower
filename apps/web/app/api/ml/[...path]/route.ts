/**
 * ML Service Proxy API
 * Routes ML service requests through Next.js for production compatibility
 * 
 * Permission: analytics:read (for reading ML predictions/scores)
 */
import { NextRequest, NextResponse } from 'next/server';
import { withPermission, type ApiHandler } from '@/lib/auth/api-wrapper';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * GET /api/ml/[...path] - Proxy GET requests to ML service
 * Permission: analytics:read
 */
const handleGetML: ApiHandler = async (request, { params, user }) => {
    const { path } = await params;
    const pathArray = Array.isArray(path) ? path : [path];
    const pathname = pathArray.join('/');
    const { searchParams } = new URL(request.url);

    try {
        const url = new URL(`/api/v1/${pathname}`, ML_SERVICE_URL);
        searchParams.forEach((value, key) => {
            url.searchParams.append(key, value);
        });

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('ML Service proxy error:', error);
        return NextResponse.json(
            { error: 'ML service unavailable' },
            { status: 503 }
        );
    }
};

/**
 * POST /api/ml/[...path] - Proxy POST requests to ML service
 * Permission: analytics:read (ML predictions are read-only analytics)
 */
const handlePostML: ApiHandler = async (request, { params, user }) => {
    const { path } = await params;
    const pathArray = Array.isArray(path) ? path : [path];
    const pathname = pathArray.join('/');

    try {
        const body = await request.json();

        const response = await fetch(`${ML_SERVICE_URL}/api/v1/${pathname}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('ML Service proxy error:', error);
        return NextResponse.json(
            { error: 'ML service unavailable' },
            { status: 503 }
        );
    }
};

// Protected routes - analytics:read permission required
export const GET = withPermission('analytics:read', handleGetML);
export const POST = withPermission('analytics:read', handlePostML);
