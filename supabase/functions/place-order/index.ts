
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
            return new Response(JSON.stringify({ error: 'Invalid input' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // --- Server-Side Logic ---

        // 1. Get Admin Config (API Key & URL) & Service Details securely
        // Using Service Role
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Priority: ENV VARS -> admin_config table
        const envApiKey = Deno.env.get('PROVIDER_API_KEY');
        const envApiUrl = Deno.env.get('PROVIDER_API_URL');

        let config = { api_key: envApiKey, api_url: envApiUrl };

        // Fallback to DB if missing
        if (!config.api_key || !config.api_url) {
            const { data: dbConfig } = await supabaseAdmin
                .from('admin_config')
                .select('*')
                .single();

            if (dbConfig) {
                if (!config.api_key) config.api_key = dbConfig.api_key;
                if (!config.api_url) config.api_url = dbConfig.api_url;
            }
        }

        if (!config.api_key || !config.api_url) {
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

        // 4. Call SMM API (STRICT FORMAT)
        const apiUrl = config.api_url;
        const apiKey = config.api_key;

        console.log(`[PlaceOrder] Using API URL: ${apiUrl}`);
        console.log(`[PlaceOrder] API Key found: ${apiKey ? 'YES (Masked)' : 'NO'}`);

        const params = new URLSearchParams();
        params.append('key', apiKey);
        params.append('action', 'add');
        params.append('service', service.service_id); // Use DB verified ID
        params.append('link', link);
        params.append('quantity', quantity.toString());

        console.log(`[PlaceOrder] Sending to API: Service=${service.service_id}, Qty=${quantity}, Link=${link}`);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, // Vital header
            body: params
        });

        console.log(`[PlaceOrder] SMM Provider Response Status: ${response.status}`);
        const rawText = await response.text();
        console.log(`[PlaceOrder] SMM Provider Raw Body: ${rawText}`);

        if (!response.ok) {
            console.error(`Status error from provider: ${response.status} - ${rawText}`);
            throw new Error(`Provider HTTP Error: ${response.status}`);
        }

        let apiResult;
        try {
            apiResult = JSON.parse(rawText);
        } catch (e) {
            console.error('Failed to parse provider response as JSON', e);
            throw new Error(`Invalid JSON from provider: ${rawText.substring(0, 100)}...`);
        }

        if (apiResult.error) {
            console.error('SMM API Error:', apiResult.error);
            throw new Error(`Provider Error: ${apiResult.error}`);
        }

        // Capture Order ID
        const providerOrderId = apiResult.order;

        if (!providerOrderId) {
            console.error('Warning: Provider did not return an order ID', apiResult);
            // We proceed but log this anomaly
        }

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

        // Insert Order Order with correct status and external ID (if column exists, generic status for now)
        const { error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: user.id,
                service_id: service_id,
                link: link,
                quantity: quantity,
                status: 'pending',
                // We don't have an 'external_id' column in the schema yet, 
                // so we just log the provider ID for now or we could store it in metadata if available.
                // If the user wants to save 'providerOrderId', they need to add a column.
                // custom_data: { provider_order_id: providerOrderId } // Example if JSONB column exists
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
