import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    // LOG DE VIDA - VERSÃO 3.0 (Nativo)
    console.log('Versão 3.0 - Boot Nativo Iniciado...');

    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const url = new URL(req.url);
        console.log(`[Webhook] Recebido: ${req.method} em ${url.pathname}`);

        const body = await req.json().catch(() => ({}));

        // Log seguro do corpo para debug
        console.log('Payload:', JSON.stringify(body));

        const action = body?.action;
        const type = body?.type;
        const dataId = body?.data?.id;
        const id = body?.id;

        // Filtro de evento
        if (action === 'payment.updated' || type === 'payment') {
            const paymentId = dataId || id;

            if (!paymentId) {
                console.log('Ignorado: ID de pagamento ausente.');
                return new Response(JSON.stringify({ ignored: true }), { status: 200, headers: corsHeaders });
            }

            console.log(`Processando Pagamento ID: ${paymentId}`);

            // 1. Consultar Mercado Pago
            const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
            if (!accessToken) throw new Error("MERCADO_PAGO_ACCESS_TOKEN ausente");

            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (!mpResponse.ok) {
                const errTxt = await mpResponse.text();
                console.error(`Erro MP: ${errTxt}`);
                return new Response(JSON.stringify({ error: "MP Error" }), { status: 200, headers: corsHeaders });
            }

            const paymentData = await mpResponse.json();
            console.log(`Status MP: ${paymentData.status}`);

            if (paymentData.status === 'approved') {
                const userId = paymentData.external_reference;
                const amount = Number(paymentData.transaction_amount);

                if (!userId) {
                    console.error('ERRO: external_reference (UserID) vazio no pagamento.');
                    return new Response(JSON.stringify({ error: 'UserId missing' }), { status: 200, headers: corsHeaders });
                }

                // 2. Inicializar Supabase Admin (Blindado)
                const sbUrl = Deno.env.get('SUPABASE_URL');
                const sbKey = Deno.env.get('SOCIAL_ADMIN_KEY'); // Sua chave nova

                if (!sbUrl || !sbKey) {
                    console.error('CRITICAL: SOCIAL_ADMIN_KEY não encontrada!');
                    throw new Error("Credenciais Admin Faltando");
                }

                const supabaseAdmin = createClient(sbUrl, sbKey, {
                    auth: { autoRefreshToken: false, persistSession: false }
                });

                // 3. Atualizar Saldo
                // Primeiro busca o saldo atual para garantir soma correta
                const { data: profile, error: fetchError } = await supabaseAdmin
                    .from('profiles')
                    .select('balance')
                    .eq('id', userId)
                    .single();

                if (fetchError) {
                    console.error('Erro ao buscar perfil:', fetchError);
                    // Se não achou perfil, não tem como dar saldo
                    return new Response(JSON.stringify({ error: "User not found" }), { status: 200, headers: corsHeaders });
                }

                const currentBalance = Number(profile?.balance || 0);
                const newBalance = currentBalance + amount;

                const { error: updateError } = await supabaseAdmin
                    .from('profiles')
                    .update({ balance: newBalance })
                    .eq('id', userId);

                if (updateError) {
                    console.error('Erro no UPDATE:', updateError);
                    throw updateError;
                }

                console.log(`SUCESSO TOTAL! Saldo de ${userId} foi de R$${currentBalance} para R$${newBalance}`);

                return new Response(JSON.stringify({ success: true, newBalance }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });

    } catch (err) {
        console.error('CRITICAL CRASH:', err);
        // Retornar 200 mesmo no erro para o MP parar de tentar (já que logamos o erro)
        return new Response(JSON.stringify({ error: String(err) }), { status: 200, headers: corsHeaders });
    }
});
