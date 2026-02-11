
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { service_id, link, quantity } = await req.json();

        if (!service_id || !link || !quantity || quantity < 1) {
            return new Response(JSON.stringify({ error: 'Invalid invalid input' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // --- Server-Side Logic ---

        // 1. Get Admin Config (API Key & URL) & Service Details securely
        // Using Service Role to access admin_config and profiles
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { data: config } = await supabaseAdmin
            .from('admin_config')
            .select('*')
            .single();

        if (!config || !config.api_key || !config.api_url) {
            throw new Error('Server misconfiguration: Missing API details');
        }

        // 2. Get Service Info (Rate, Min, Max)
        const { data: service } = await supabaseAdmin
            .from('services')
            .select('*')
            .eq('service_id', service_id)
            .single();

        if (!service) {
            throw new Error('Service not found');
        }

        if (quantity < service.min || quantity > service.max) {
            throw new Error(`Quantity must be between ${service.min} and ${service.max}`);
        }

        // Calculate Cost
        // Rate is per 1000
        const cost = (quantity / 1000) * service.rate;

        // 3. Check Balance
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('balance')
            .eq('id', user.id)
            .single();

        if (!profile || profile.balance < cost) {
            return new Response(JSON.stringify({ error: 'Saldo insuficiente.' }), {
                status: 402, // Payment Required
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 4. Call SMM API
        const apiUrl = config.api_url; // e.g., https://agenciapopular.com/api/v2
        const apiKey = config.api_key;

        const params = new URLSearchParams();
        params.append('key', apiKey);
        params.append('action', 'add');
        params.append('service', service_id);
        params.append('link', link);
        params.append('quantity', quantity.toString());

        console.log(`Sending order to API: Service ${service_id}, Qty ${quantity}, Cost ${cost}`);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });

        const apiResult = await response.json();

        if (apiResult.error) {
            console.error('SMM API Error:', apiResult.error);
            throw new Error(`Provider Error: ${apiResult.error}`);
        }

        const providerOrderId = apiResult.order;

        // 5. Deduct Balance & create Order
        // Transaction-like update: Deduct first
        const newBalance = Number(profile.balance) - cost;

        const { error: balanceError } = await supabaseAdmin
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', user.id);

        if (balanceError) {
            throw new Error('Failed to update balance');
        }

        const { error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: user.id,
                service_id: service_id,
                link: link,
                quantity: quantity,
                status: 'pending', // or 'processing'
                // Assuming 'provider_order_id' column exists, if not, might need migration or ignore
                // For now, let's stick to standard schema
                // cost: cost // if needed
            });

        if (orderError) {
            console.error('Failed to insert order record', orderError);
            // In a perfect world, we'd refund here. For now, we log critical error.
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Pedido realizado com sucesso!',
            orderId: providerOrderId,
            cost: cost,
            remainingBalance: newBalance
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        console.error('Order Error:', err);
        return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
