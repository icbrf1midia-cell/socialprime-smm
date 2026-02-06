
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
        throw new Error('No authorization header passed')
    }

    const { amount, returnUrl, completionUrl, customer } = await req.json()

    if (!amount) {
        throw new Error('Amount is required')
    }

    const valueInCents = Math.round(Number(amount) * 100)

    // Use ABACATEPAY_API_KEY from secrets
    const abacatePayKey = Deno.env.get('ABACATEPAY_API_KEY')
    if (!abacatePayKey) {
        console.error('ABACATEPAY_API_KEY is not set')
        throw new Error('Server misconfiguration: Missing API Key')
    }

    const body = {
        frequency: 'ONE_TIME',
        methods: ['PIX'],
        products: [{
            externalId: 'add-funds',
            name: 'Adicionar Saldo',
            quantity: 1,
            price: valueInCents,
        }],
        returnUrl: returnUrl,
        completionUrl: completionUrl,
        customer: customer
    }

    console.log('Creating billing with AbacatePay:', JSON.stringify(body))

    const response = await fetch('https://api.abacatepay.com/v1/billing/create', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${abacatePayKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })

    const data = await response.json()

    if (!response.ok) {
        console.error('AbacatePay API Error:', data)
        throw new Error(`AbacatePay Error: ${JSON.stringify(data)}`)
    }

    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
