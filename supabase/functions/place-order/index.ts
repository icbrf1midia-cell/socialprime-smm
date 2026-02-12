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

        // 1. Identificar o Usuário
        const authHeader = req.headers.get('Authorization')!
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))

        if (userError || !user) throw new Error('Usuário não autenticado.')

        // 2. Receber dados do Pedido
        const body = await req.json()
        const serviceId = body.service || body.service_id || body.id;
        const link = body.link || body.url;
        const quantity = parseInt(body.quantity);

        if (!serviceId || !link || !quantity) throw new Error('Dados incompletos.')

        // 3. Buscar Preço (COM CORREÇÃO: Removido category_id e status)
        // Buscamos apenas 'rate', 'min' e 'max' que sabemos que existem
        const { data: serviceData, error: serviceError } = await supabaseClient
            .from('services')
            .select('rate, min, max')
            .eq('service_id', serviceId)
            .maybeSingle()

        // Backup: tentar pelo ID normal se não achar pelo service_id
        let localService = serviceData
        if (!localService) {
            const { data: serviceDataBackup } = await supabaseClient
                .from('services')
                .select('rate, min, max')
                .eq('id', serviceId) // Cuidado: se sua tabela não tem ID, isso pode falhar, mas o anterior deve resolver
                .maybeSingle()
            localService = serviceDataBackup
        }

        if (!localService) {
            // Se não achou, vamos logar o erro para saber o que aconteceu
            console.error(`[PlaceOrder] Serviço ${serviceId} não encontrado.`)
            throw new Error(`Serviço ID ${serviceId} não encontrado (ou colunas incorretas).`)
        }

        // 4. Calcular Custo
        const cost = (Number(localService.rate) * quantity) / 1000;

        // 5. Verificar Saldo
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('balance')
            .eq('id', user.id)
            .single()

        if ((profile?.balance || 0) < cost) {
            return new Response(JSON.stringify({ error: `Saldo insuficiente. Necessário: R$ ${cost.toFixed(2)}` }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // 6. Enviar para Agência Popular
        const { data: config } = await supabaseClient
            .from('admin_config')
            .select('api_key, api_url')
            .single()

        const params = new URLSearchParams()
        params.append('key', config.api_key.trim())
        params.append('action', 'add')
        params.append('service', serviceId)
        params.append('link', link)
        params.append('quantity', quantity.toString())

        const response = await fetch(config.api_url.trim(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params,
        })

        const result = await response.json() // Tenta parse direto pois sabemos que funciona

        if (result.error) {
            return new Response(JSON.stringify({ error: result.error }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // 7. SUCESSO: Descontar, Salvar e Registrar Nome
        await supabaseClient
            .from('profiles')
            .update({
                balance: (profile.balance - cost),
                // Aproveitamos para atualizar o total gasto do usuário no perfil
                total_spent: (Number(profile.total_spent || 0) + cost)
            })
            .eq('id', user.id)

        await supabaseClient
            .from('orders')
            .insert({
                user_id: user.id,
                service_id: serviceId,
                service_name: 'Instagram Visualizações no Reels', // <-- AGORA O NOME FICA SALVO!
                link: link,
                quantity: quantity,
                amount: cost,
                charge: cost,
                status: 'pending',
                external_id: result.order,
                created_at: new Date().toISOString()
            })

        return new Response(JSON.stringify({ success: true, order: result.order }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (err) {
        console.error('[PlaceOrder] ERRO:', err.message)
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})