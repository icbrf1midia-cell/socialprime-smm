// VERSÃO 10.0 - ULTRA LEVE (ZERO DEPENDÊNCIAS)
// Eliminamos a biblioteca supabase-js para economizar memória e CPU.
// Usamos REST API direto. Isso evita o crash de Boot.

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log("Versão 10.0 LEVE - Esperando MP...");

Deno.serve(async (req) => {
    // 1. Tratamento de CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const url = new URL(req.url);

        // 2. Leitura do Corpo como Texto (Mais leve que JSON no inicio)
        const rawBody = await req.text();

        // Log curto para confirmar recebimento sem poluir
        console.log(`[V10] Recebido. Tamanho: ${rawBody.length} bytes`);

        // Parse manual seguro
        let body;
        try {
            body = JSON.parse(rawBody);
        } catch {
            console.log("Corpo não é JSON válido, ignorando.");
            return new Response("OK", { status: 200, headers: corsHeaders });
        }

        const action = body?.action;
        const type = body?.type;
        const dataId = body?.data?.id;
        const id = body?.id;

        // 3. Filtro
        if (action === 'payment.updated' || action === 'payment.created' || type === 'payment') {
            const paymentId = dataId || id;
            if (!paymentId) return new Response("Ignored", { status: 200, headers: corsHeaders });

            console.log(`Processando ID: ${paymentId}`);

            // 4. Consulta Mercado Pago (Fetch Nativo)
            const mpToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
            const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { 'Authorization': `Bearer ${mpToken}` }
            });

            if (!mpRes.ok) {
                console.log("Erro MP API"); // Log simples
                return new Response("MP Error", { status: 200, headers: corsHeaders });
            }

            const paymentData = await mpRes.json();

            if (paymentData.status === 'approved') {
                const userId = paymentData.external_reference;
                const amount = Number(paymentData.transaction_amount);

                if (!userId) {
                    console.log("Sem UserID");
                    return new Response("OK", { status: 200, headers: corsHeaders });
                }

                console.log(`Aprovado! Creditando via REST API...`);

                // 5. ATUALIZAÇÃO SUPABASE VIA REST (SEM BIBLIOTECA)
                // Isso consome quase zero memória comparado ao createClient
                const sbUrl = Deno.env.get('SUPABASE_URL');
                const sbKey = Deno.env.get('SOCIAL_ADMIN_KEY');

                // Passo A: Ler Saldo (GET)
                const getRes = await fetch(`${sbUrl}/rest/v1/profiles?id=eq.${userId}&select=balance`, {
                    method: 'GET',
                    headers: {
                        'apikey': sbKey,
                        'Authorization': `Bearer ${sbKey}`
                    }
                });

                // Se falhar na leitura, assume 0 pra não quebrar (ou trata erro)
                let currentBalance = 0;
                if (getRes.ok) {
                    const rows = await getRes.json();
                    if (rows.length > 0) currentBalance = Number(rows[0].balance);
                }

                const newBalance = currentBalance + amount;

                // Passo B: Atualizar Saldo (PATCH)
                const patchRes = await fetch(`${sbUrl}/rest/v1/profiles?id=eq.${userId}`, {
                    method: 'PATCH',
                    headers: {
                        'apikey': sbKey,
                        'Authorization': `Bearer ${sbKey}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({ balance: newBalance })
                });

                if (patchRes.ok) {
                    console.log(`SUCESSO V10! Saldo: ${newBalance}`);
                } else {
                    console.error(`Erro Update: ${await patchRes.text()}`);
                }
            }
        }

        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error("ERRO:", err);
        return new Response("Error handled", { status: 200, headers: corsHeaders });
    }
});