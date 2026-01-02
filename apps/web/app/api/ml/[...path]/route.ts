/**
 * ML Service Proxy API
 * Routes ML service requests through Next.js for production compatibility
 */
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

interface RouteParams {
    params: Promise<{ path: string[] }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    const { path } = await params;
    const pathname = path.join('/');
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
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    const { path } = await params;
    const pathname = path.join('/');

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
}
