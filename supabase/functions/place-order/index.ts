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

        const { service, link, quantity } = await req.json()
        console.log(`[PlaceOrder] Tentando enviar: Serviço=${service}, Qtd=${quantity}`)

        const { data: config, error: dbError } = await supabaseClient
            .from('admin_config')
            .select('api_key, api_url')
            .single()

        if (dbError || !config) {
            throw new Error('Não consegui ler a tabela admin_config!')
        }

        const cleanKey = config.api_key.trim();
        const cleanUrl = config.api_url.trim();

        console.log(`[PlaceOrder] Usando URL: ${cleanUrl}`)
        console.log(`[PlaceOrder] Usando Key (final): ...${cleanKey.slice(-5)}`)

        const params = new URLSearchParams()
        params.append('key', cleanKey)
        params.append('action', 'add')
        params.append('service', service)
        params.append('link', link)
        params.append('quantity', quantity)

        const response = await fetch(cleanUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params,
        })

        const responseText = await response.text()
        console.log(`[PlaceOrder] O QUE A AGÊNCIA RESPONDEU: ${responseText}`)

        let result
        try {
            result = JSON.parse(responseText)
        } catch {
            throw new Error(`Erro API (Não é JSON): ${responseText}`)
        }

        if (result.error) {
            console.error('[PlaceOrder] Erro Lógico da API:', result.error)
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
        console.error('[PlaceOrder] ERRO FATAL:', err.message)
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})