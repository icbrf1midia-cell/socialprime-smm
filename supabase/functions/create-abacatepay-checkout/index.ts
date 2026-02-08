
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://socialprime-smm.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Debug: Check if API Key exists
  const apiKey = Deno.env.get('ABACATEPAY_API_KEY')
  console.log('Chave API existe?', !!apiKey)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const rawBody = await req.json()
    console.log('Body recebido:', JSON.stringify(rawBody))

    const { amount, customer, returnUrl, completionUrl, userId } = rawBody

    console.log(`[DEBUG] UserId received: ${userId}`)

    // 2. Simplificação Radical: Payload Construction

    // Ensure we have a valid identifier
    const userIdentifier = userId || customer?.email || 'unknown_user';
    console.log(`[DEBUG] Using userIdentifier: ${userIdentifier}`);

    const valueInCents = Math.round(Number(amount) * 100)

    const payload = {
      frequency: "ONE_TIME",
      methods: ["PIX"],
      products: [
        {
          externalId: `recharge_${userIdentifier}`, // STRATEGY B: Embed ID in product
          name: "Recarga de Saldo",
          quantity: 1,
          price: valueInCents
        }
      ],
      returnUrl: returnUrl || "https://socialprime-smm.vercel.app/",
      completionUrl: completionUrl || "https://socialprime-smm.vercel.app/",
      metadata: {
        userId: userIdentifier // STRATEGY A: Keep trying metadata
      },
      customer: {
        name: customer?.name || "Cliente SocialPrime",
        email: customer?.email,
        cellphone: customer?.cellphone,
        taxId: customer?.taxId
      }
    }

    console.log('Payload para AbacatePay:', JSON.stringify(payload))

    const response = await fetch('https://api.abacatepay.com/v1/billing/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    // 3. Capture Raw Text
    const responseText = await response.text()
    console.log(`AbacatePay Status: ${response.status}`)
    console.log('AbacatePay Raw Response:', responseText)

    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = { text: responseText }
    }

    // 4. Return everything to Frontend (No more null)
    return new Response(
      JSON.stringify({
        upstreamStatus: response.status,
        upstreamData: responseData,
        sentPayload: payload // Echo back what we sent for debugging
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Always 200 so frontend can read the body
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
