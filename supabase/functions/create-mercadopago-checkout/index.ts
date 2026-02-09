import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // 1. Debug: Check if API Key exists
    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
    console.log('Access Token exists?', !!accessToken)

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const rawBody = await req.json()
        console.log('Body recebido:', JSON.stringify(rawBody))

        const { amount, customer, userId } = rawBody

        // STRICT CHECK: UserId is mandatory for balance update
        if (!userId) {
            throw new Error("UserId is mandatory for this operation");
        }

        console.log(`[DEBUG] UserId received: ${userId}`)

        // Mercado Pago expects "firstname" and "lastname" separately, but we can just put full name in first_name sometimes or split it.
        // Ideally split.
        let firstName = "Cliente";
        let lastName = "SocialPrime";
        if (customer?.name) {
            const parts = customer.name.split(' ');
            firstName = parts[0];
            lastName = parts.slice(1).join(' ') || "SocialPrime";
        }

        // Amount needs to be number
        const transactionAmount = Number(amount);

        const payload = {
            transaction_amount: transactionAmount,
            description: "Recarga de Saldo - SocialPrime",
            payment_method_id: "pix",
            payer: {
                email: customer?.email || "email@unknown.com",
                first_name: firstName,
                last_name: lastName,
                identification: {
                    type: "CPF",
                    number: customer?.taxId?.replace(/\D/g, '') || ""
                }
            },
            external_reference: userId, // CRITICAL: This links the payment to the Supabase User
            notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook` // Dynamic URL
        }

        console.log('Payload para Mercado Pago:', JSON.stringify(payload))

        const response = await fetch('https://api.mercadopago.com/v1/payments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': crypto.randomUUID()
            },
            body: JSON.stringify(payload)
        })

        const responseText = await response.text()
        console.log(`Mercado Pago Status: ${response.status}`)

        let responseData
        try {
            responseData = JSON.parse(responseText)
        } catch {
            responseData = { text: responseText }
        }

        if (response.status !== 201 && response.status !== 200) {
            console.error('Mercado Pago Error:', responseData)
            throw new Error(`Mercado Pago API Error: ${responseData.message || JSON.stringify(responseData)}`)
        }

        // Extract Pix Code and QR Code Base64
        const pointOfInteraction = responseData.point_of_interaction;
        const transactionData = pointOfInteraction?.transaction_data;
        const qrCode = transactionData?.qr_code;
        const qrCodeBase64 = transactionData?.qr_code_base64;
        const ticketUrl = transactionData?.ticket_url; // Link to payment page if needed

        // Return to Frontend
        return new Response(
            JSON.stringify({
                success: true,
                pixCode: qrCode,
                qrCodeBase64: qrCodeBase64,
                paymentId: responseData.id,
                status: responseData.status,
                ticketUrl: ticketUrl
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Edge Function Internal Error:', error)
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : String(error),
                type: 'InternalFunctionError'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
