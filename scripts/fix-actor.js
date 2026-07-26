require('dotenv').config({ path: './apps/web/.env.local' });

async function run() {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/service_actors?service_name=eq.case-automation`;
    
    const response = await fetch(url, {
        method: 'PATCH',
        headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            allowed_operations: ['cases:create', 'cases:update', 'cases:assign', 'cases:system-create']
        })
    });

    const data = await response.json();
    if (response.ok) {
        console.log("✅ Successfully updated service_actors via REST API!");
        console.log(data);
    } else {
        console.error("❌ Failed:", data);
    }
}
run();
