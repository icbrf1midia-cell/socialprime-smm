
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // 1. Handle CORS preflight requests immediately
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    let reqBody;
    try {
      reqBody = await req.json()
    } catch (e) {
      throw new Error('Invalid JSON body')
    }

    console.log('Incoming Request Body:', JSON.stringify(reqBody))

    const { amount, returnUrl, completionUrl, customer } = reqBody

    // Validate Required Fields
    if (!amount) throw new Error('Missing field: amount')
    if (!customer) throw new Error('Missing field: customer')
    if (!customer.email) throw new Error('Missing field: customer.email')

    // Format Amount (Strict Integer Cents)
    // AddFunds.tsx sends a number, but we ensure it's treated correctly
    // If it comes as string "10.50", parseFloat works. If number 10.50, it works.
    const numericAmount = Number(amount)

    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error(`Invalid amount: ${amount}`)
    }

    // Convert to cents (R$ 10,00 -> 1000)
    const valueInCents = Math.round(numericAmount * 100)

    console.log(`Amount Cents: ${valueInCents}`)

    // Format TaxID
    let cleanTaxId = customer.taxId ? String(customer.taxId).replace(/\D/g, '') : ''

    // Use ABACATEPAY_API_KEY from secrets
    const abacatePayKey = Deno.env.get('ABACATEPAY_API_KEY')
    if (!abacatePayKey) {
      console.error('ABACATEPAY_API_KEY is not set')
      throw new Error('Server misconfiguration: Missing API Key')
    }

    // Construct Body for AbacatePay V1
    const body = {
      amount: valueInCents,
      customer: {
        name: customer.name || customer.email,
        email: customer.email,
        taxId: cleanTaxId || undefined,
      },
      methods: ['PIX'],
      metadata: {
        userId: customer.metadata?.userId || customer.name
      },
      returnUrl: returnUrl,
      completionUrl: completionUrl
    }

    console.log('Sending Payload to AbacatePay:', JSON.stringify(body))

    const response = await fetch('https://api.abacatepay.com/v1/billing/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${abacatePayKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    const responseText = await response.text()
    console.log(`AbacatePay Response Status: ${response.status}`)
    console.log('AbacatePay Raw Response Body:', responseText)

    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      data = { raw: responseText }
    }

    if (!response.ok) {
      // Return 400 with the upstream error data
      return new Response(
        JSON.stringify({
          error: 'AbacatePay API Error',
          details: data,
          raw_message: responseText
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Edge Function Fatal Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
