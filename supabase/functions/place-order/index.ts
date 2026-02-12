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
        // 1. Configurar Cliente Supabase (com permissão de Admin)
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 2. Identificar o Usuário (Quem está fazendo o pedido?)
        // Pegamos o token enviado pelo site para saber quem é a "Luana Costa"
        const authHeader = req.headers.get('Authorization')!
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))

        if (userError || !user) {
            throw new Error('Usuário não autenticado.')
        }

        // 3. Receber dados do Pedido
        const body = await req.json()
        const serviceId = body.service || body.service_id || body.id; // Garante pegar o ID certo
        const link = body.link || body.url;
        const quantity = parseInt(body.quantity);

        if (!serviceId || !link || !quantity) throw new Error('Dados incompletos (service, link ou quantity).')

        // 4. Buscar Preço do Serviço e Configurações
        // Buscamos o serviço no SEU banco para saber quanto cobrar
        const { data: serviceData, error: serviceError } = await supabaseClient
            .from('services')
            .select('rate, min, max, category_id') // Assumindo que o nome da coluna de preço é 'rate'
            .eq('service_id', serviceId) // Tenta pelo ID do provedor
            .maybeSingle()

        // Se não achar pelo service_id, tenta pelo id normal
        let localService = serviceData
        if (!localService) {
            const { data: serviceDataBackup } = await supabaseClient
                .from('services')
                .select('rate, min, max, category_id')
                .eq('id', serviceId)
                .single()
            localService = serviceDataBackup
        }

        if (!localService) throw new Error(`Serviço ID ${serviceId} não encontrado no seu banco de dados.`)

        // Buscar Config da API (Chave e URL)
        const { data: config } = await supabaseClient
            .from('admin_config')
            .select('api_key, api_url')
            .single()

        if (!config) throw new Error('Configuração da API não encontrada.')

        // 5. Calcular Custo e Verificar Saldo
        // Rate geralmente é por 1000. Ex: R$ 1.50 por 1000.
        const cost = (Number(localService.rate) * quantity) / 1000;

        // Buscar saldo do usuário
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

        // 6. Enviar Pedido para Agência Popular (A Parte que já funciona!)
        console.log(`[PlaceOrder] Enviando pedido. Custo: R$ ${cost}. Saldo atual: R$ ${profile?.balance}`)

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

        const responseText = await response.text()
        let result
        try {
            result = JSON.parse(responseText)
        } catch {
            throw new Error(`Erro na resposta da API SMM: ${responseText}`)
        }

        if (result.error) {
            console.error('[PlaceOrder] Recusado pela Agência:', result.error)
            return new Response(JSON.stringify({ error: result.error }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // 7. SUCESSO! Agora mexemos no dinheiro e histórico
        const externalOrderId = result.order;

        // A. Descontar Saldo
        const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({ balance: (profile.balance - cost) })
            .eq('id', user.id)

        if (updateError) console.error('Erro ao descontar saldo:', updateError)

        // B. Salvar no Histórico (Tabela orders)
        const { error: insertError } = await supabaseClient
            .from('orders')
            .insert({
                user_id: user.id,
                service_id: serviceId, // Ou o ID local, dependendo da sua estrutura
                link: link,
                quantity: quantity,
                amount: cost, // Valor cobrado
                status: 'pending',
                external_id: externalOrderId,
                created_at: new Date().toISOString()
            })

        if (insertError) console.error('Erro ao salvar pedido no histórico:', insertError)

        // Retornar sucesso para o site
        return new Response(JSON.stringify({
            success: true,
            order: externalOrderId,
            new_balance: profile.balance - cost
        }), {
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