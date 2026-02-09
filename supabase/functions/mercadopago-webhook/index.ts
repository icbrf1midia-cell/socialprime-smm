import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    console.log(`[Webhook Debug] Method: ${req.method} URL: ${req.url}`);

    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const url_string = req.url;
        const url = new URL(url_string);
        // Mercado Pago sends topic/id in query params often, or in body.
        // Usually body: { action: 'payment.updated', data: { id: '...' }, ... }

        const body = await req.json().catch(() => ({}));
        console.log('Webhook Mercado Pago recebido:', JSON.stringify(body));

        const action = body?.action;
        const type = body?.type;
        const dataId = body?.data?.id;
        const id = body?.id; // v2 sometimes sends just 'id'

        // Check if it's a payment update
        // MP sends different structures sometimes, but 'action: payment.updated' is standard for v1.
        if (action === 'payment.updated' || type === 'payment') {
            const paymentId = dataId || id;

            if (!paymentId) {
                console.log('ID do pagamento não encontrado no webhook.');
                return new Response(JSON.stringify({ ignored: true }), { status: 200, headers: corsHeaders });
            }

            console.log(`Verificando pagamento ID: ${paymentId}`);

            // Fetch current status from Mercado Pago API
            // NEVER trust the webhook body status blindly, always fetch fresh data.
            const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
            if (!accessToken) {
                throw new Error("MERCADO_PAGO_ACCESS_TOKEN not set");
            }

            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!mpResponse.ok) {
                const errorText = await mpResponse.text();
                console.error(`Erro ao consultar Mercado Pago: ${errorText}`);
                // Return 200 to MP so it stops retrying, but log error
                return new Response(JSON.stringify({ error: "Failed to fetch payment", details: errorText }), { status: 200, headers: corsHeaders });
            }

            const paymentData = await mpResponse.json();
            console.log(`Status do Pagamento ${paymentId}: ${paymentData.status}`);

            if (paymentData.status === 'approved') {
                const userId = paymentData.external_reference;
                const amountReceived = paymentData.transaction_amount;

                console.log(`Pagamento Aprovado! User: ${userId}, Valor: ${amountReceived}`);

                if (!userId) {
                    console.error('UserId (external_reference) não encontrado no pagamento.');
                    return new Response(JSON.stringify({ error: 'UserId missing' }), { status: 200, headers: corsHeaders });
                }

                // Update Supabase with Admin Rights (Bypass RLS)
                const supabaseAdmin = createClient(
                    Deno.env.get('SUPABASE_URL') ?? '',
                    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
                    {
                        auth: {
                            autoRefreshToken: false,
                            persistSession: false
                        }
                    }
                );

                // 1. Get current balance
                const { data: profile, error: fetchError } = await supabaseAdmin
                    .from('profiles')
                    .select('balance')
                    .eq('id', userId)
                    .single()

                if (fetchError) {
                    console.error('Erro ao buscar perfil:', fetchError)
                    // Probably invalid user ID or DB issue. Return 200 to stop retries if logic error, but maybe MP retry is good if DB is down?
                    // Let's return 200 and log to be safe against infinite loops.
                    return new Response(JSON.stringify({ error: "Profile fetch failed", details: fetchError }), { status: 200, headers: corsHeaders });
                }

                const currentBalance = Number(profile.balance || 0);
                const amountToAdd = Number(amountReceived);
                const newBalance = currentBalance + amountToAdd;

                // 2. Update balance
                const { error: updateError } = await supabaseAdmin
                    .from('profiles')
                    .update({ balance: newBalance })
                    .eq('id', userId)

                if (updateError) {
                    console.error('Erro ao atualizar saldo:', updateError)
                    return new Response(JSON.stringify({ error: "Balance update failed", details: updateError }), { status: 200, headers: corsHeaders });
                }

                console.log(`Saldo atualizado: ${currentBalance} -> ${newBalance}`);

                return new Response(JSON.stringify({ success: true, newBalance }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200
                })
            } else {
                console.log(`Pagamento não está aprovado (Status: ${paymentData.status}). Ignorando.`);
                return new Response(JSON.stringify({ status: paymentData.status }), { status: 200, headers: corsHeaders });
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })

    } catch (error) {
        console.error('CRITICAL Webhook Error:', error);
        // ALWAYS return 200 to Mercado Pago to avoid retries on logic errors
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })
    }
})
