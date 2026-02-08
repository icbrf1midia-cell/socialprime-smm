import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const secret = req.headers.get('x-webhook-secret')
        // You should set this secret in Supabase Dashboard -> Edge Functions -> Secrets
        // For now, let's just log it. In production, uncomment the check.
        // if (secret !== Deno.env.get('ABACATEPAY_WEBHOOK_SECRET')) { ... }

        const body = await req.json()
        console.log('Webhook AbacatePay recebido:', JSON.stringify(body))

        const { event, data } = body

        if (event === 'billing.paid' || data?.status === 'PAID') {
            const amountInCents = data?.amount || body?.data?.amount || 0

            // Try to find userId in multiple possible locations
            const userId =
                data?.metadata?.userId ||
                body?.metadata?.userId ||
                data?.payment?.metadata?.userId ||
                data?.billing?.metadata?.userId

            console.log(`[DEBUG] Payload metadata:`, JSON.stringify(data?.metadata))
            console.log(`[DEBUG] Extracted UserId: ${userId}`)

            if (!userId) {
                console.error('UserId não encontrado no metadata')
                return new Response(JSON.stringify({ error: 'UserId missing' }), { status: 400, headers: corsHeaders })
            }

            console.log(`Processando pagamento de ${amountInCents} centavos para user ${userId}`)

            // Init Supabase Admin Client
            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

            // 1. Get current balance
            const { data: profile, error: fetchError } = await supabaseAdmin
                .from('profiles')
                .select('balance')
                .eq('id', userId)
                .single()

            if (fetchError) {
                console.error('Erro ao buscar perfil:', fetchError)
                throw fetchError
            }

            const currentBalance = Number(profile.balance || 0)
            const amountToAdd = Number(amountInCents) / 100
            const newBalance = currentBalance + amountToAdd

            // 2. Update balance
            const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({ balance: newBalance })
                .eq('id', userId)

            if (updateError) {
                console.error('Erro ao atualizar saldo:', updateError)
                throw updateError
            }

            console.log(`Saldo atualizado com sucesso: ${currentBalance} -> ${newBalance}`)

            return new Response(JSON.stringify({ success: true, newBalance }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            })
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })

    } catch (error) {
        console.error('Webhook Error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        })
    }
})
