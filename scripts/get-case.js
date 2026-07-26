require('dotenv').config({ path: './apps/web/.env.local' });

async function run() {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/cases?case_number=eq.FDX-INDIA-2607-JU4R09&select=*,dcas(name)`;
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
        }
    });

    const data = await response.json();
    console.log("CASE DETAILS:");
    console.log(JSON.stringify(data, null, 2));

    if (data && data.length > 0) {
        const caseId = data[0].id;
        const slaUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/sla_logs?case_id=eq.${caseId}&select=*,sla_templates(name,duration_hours)`;
        const slaResponse = await fetch(slaUrl, {
            method: 'GET',
            headers: {
                'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        const slaData = await slaResponse.json();
        console.log("\nSLA DETAILS:");
        console.log(JSON.stringify(slaData, null, 2));
    }
}
run();
