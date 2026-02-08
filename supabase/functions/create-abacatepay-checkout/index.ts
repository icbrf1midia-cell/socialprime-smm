
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

    const { amount, customer, returnUrl, completionUrl } = rawBody

    // 2. Simplificação Radical: Payload Construction
    // Envie apenas o email, o amount e o method: ['PIX']
    const payload = {
      amount: Math.round(Number(amount) * 100), // Integer cents
      customer: {
        email: customer?.email,
        name: customer?.name || "Cliente Debug", // AbacatePay might require a name
      },
      methods: ['PIX'],
      returnUrl: returnUrl || "https://socialprime-smm.vercel.app/dashboard", // Fallback to avoid 'missing returnUrl' if strictly required, but keeping it simple
      completionUrl: completionUrl || "https://socialprime-smm.vercel.app/dashboard"
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
