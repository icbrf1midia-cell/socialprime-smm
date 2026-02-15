
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // 1. Handle CORS (Permite que o site chame a função)
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { api_url, api_key, margin } = await req.json()

        if (!api_url || !api_key) {
            throw new Error('Configuração incompleta (URL ou Key faltando).')
        }

        console.log(`Iniciando sincronização com: ${api_url} (Margem: ${margin}%)`)

        // 2. Busca Serviços no Fornecedor (Padrão SMM - Action: services)
        const params = new URLSearchParams();
        params.append('key', api_key);
        params.append('action', 'services');

        const response = await fetch(api_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params,
        });

        const providerServices = await response.json();

        if (!Array.isArray(providerServices)) {
            console.error('Erro Fornecedor:', providerServices);
            throw new Error('A API do fornecedor não retornou uma lista válida. Verifique a Chave API.');
        }

        // 3. Processa e Calcula Preços
        const servicesToUpsert = providerServices.map((s: any) => {
            const cost = parseFloat(s.rate); // Custo por 1000
            const profitMargin = Number(margin) || 0;

            // Preço Final = Custo + (Custo * Porcentagem)
            const finalPrice = cost + (cost * (profitMargin / 100));

            return {
                service_id: Number(s.service),
                name: s.name,
                category: s.category,
                rate: Number(finalPrice.toFixed(2)), // Arredonda para 2 casas
                min: Number(s.min),
                max: Number(s.max),
                type: s.type,
                // Mantém a descrição se existir, senão põe um padrão
                description: s.description || 'Serviço importado automaticamente.'
            }
        });

        // 4. Salva no Supabase (Upsert: Atualiza se existir, Cria se não)
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Insere em lotes para não travar se forem muitos serviços
        const { error } = await supabase
            .from('services')
            .upsert(servicesToUpsert, { onConflict: 'service_id' })

        if (error) throw error;

        return new Response(
            JSON.stringify({ success: true, count: servicesToUpsert.length }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
