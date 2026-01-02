import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch notification preferences
export async function GET() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch preferences - check if user_preferences table exists or use user metadata
    const preferences = user.user_metadata?.notification_preferences || {
        case_updates: { email: true, inApp: true },
        sla_alerts: { email: true, inApp: true },
        dca_performance: { email: false, inApp: true },
        escalations: { email: true, inApp: true },
        system_updates: { email: false, inApp: true },
    };

    return NextResponse.json(preferences);
}

// PUT - Update notification preferences
export async function PUT(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { preferences } = body;

    // Store in user metadata
    const { error: updateError } = await supabase.auth.updateUser({
        data: { notification_preferences: preferences },
    });

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Preferences saved' });
}
