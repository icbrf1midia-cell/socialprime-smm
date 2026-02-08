
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://socialprime-smm.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, region',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log raw body for debugging
    try {
      const clone = req.clone()
      console.log("Recebi isso no body:", await clone.json())
    } catch (e) {
      console.log("Erro ao ler body para log:", e)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    let reqBody;
    try {
      reqBody = await req.json()
    } catch (e) {
      console.error("Erro ao fazer parse do JSON:", e)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body', details: String(e) }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    // console.log('Incoming Request Body:', JSON.stringify(reqBody)) // Redundant/Removed in favor of top logger

    const { amount, returnUrl, completionUrl, customer } = reqBody

    // Validate Required Fields
    if (!amount) throw new Error('Missing field: amount')
    if (!customer) throw new Error('Missing field: customer')
    if (!customer.email) throw new Error('Missing field: customer.email')

    // Format Amount (Strict Integer Cents)
    const numericAmount = Number(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error(`Invalid amount: ${amount}`)
    }
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

    if (!response.ok) {
      return new Response(
        JSON.stringify({ detalhe: responseText }), // Returning exact logic requested
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      data = { raw: responseText }
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
