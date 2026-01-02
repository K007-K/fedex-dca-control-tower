/**
 * Google Places Autocomplete Proxy API
 * 
 * This proxies requests to Google Places API to avoid exposing API key in client
 * Set GOOGLE_PLACES_API_KEY in your environment variables
 */

import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get('input');

    if (!input) {
        return NextResponse.json({ error: 'Input is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
        // Return the input as a suggestion if no API key
        return NextResponse.json({
            predictions: [
                {
                    place_id: 'custom-1',
                    description: input,
                    structured_formatting: {
                        main_text: input,
                        secondary_text: 'Custom location'
                    }
                }
            ]
        });
    }

    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=geocode&key=${apiKey}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch from Google Places API');
        }

        const data = await response.json();

        return NextResponse.json({
            predictions: data.predictions || []
        });

    } catch (error) {
        console.error('Places API error:', error);
        // Return input as fallback
        return NextResponse.json({
            predictions: [
                {
                    place_id: 'fallback-1',
                    description: input,
                    structured_formatting: {
                        main_text: input,
                        secondary_text: 'Your entered location'
                    }
                }
            ]
        });
    }
}
