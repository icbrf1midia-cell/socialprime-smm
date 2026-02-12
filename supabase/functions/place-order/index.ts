import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. LER O CORPO INTEIRO (Para ver o que o site está mandando)
        const body = await req.json()
        console.log('[PlaceOrder] PAYLOAD RECEBIDO DO SITE:', JSON.stringify(body))

        // 2. TENTAR ENCONTRAR O SERVICE ID (Não importa o nome que venha)
        const serviceId = body.service || body.service_id || body.serviceId || body.id;
        const link = body.link || body.url;
        const quantity = body.quantity;

        // Se ainda assim for undefined, paramos aqui
        if (!serviceId) {
            throw new Error(`ID do Serviço não encontrado! Recebido: ${JSON.stringify(body)}`)
        }

        console.log(`[PlaceOrder] Processando: ID=${serviceId}, Qtd=${quantity}`)

        const { data: config, error: dbError } = await supabaseClient
            .from('admin_config')
            .select('api_key, api_url')
            .single()

        if (dbError || !config) {
            throw new Error('Erro ao ler admin_config do banco.')
        }

        const cleanKey = config.api_key.trim();
        const cleanUrl = config.api_url.trim();

        const params = new URLSearchParams()
        params.append('key', cleanKey)
        params.append('action', 'add')
        params.append('service', serviceId) // Usamos o ID que encontramos
        params.append('link', link)
        params.append('quantity', quantity)

        const response = await fetch(cleanUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params,
        })

        const responseText = await response.text()
        console.log(`[PlaceOrder] RESPOSTA DA AGÊNCIA: ${responseText}`)

        let result
        try {
            result = JSON.parse(responseText)
        } catch {
            throw new Error(`Erro API (Não é JSON): ${responseText}`)
        }

        if (result.error) {
            console.error('[PlaceOrder] Erro da API SMM:', result.error)
            return new Response(JSON.stringify({ error: result.error }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (err) {
        console.error('[PlaceOrder] ERRO NO SERVIDOR:', err.message)
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})