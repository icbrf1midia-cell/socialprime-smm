
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://socialprime-smm.vercel.app', // Explicit Origin
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, region',
}

serve(async (req) => {
  // GLOBAL TRY/CATCH WRAPPER
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // Parse Body
    let reqBody
    try {
      reqBody = await req.json()
    } catch (e) {
      throw new Error(`Falha ao ler JSON do corpo: ${e instanceof Error ? e.message : String(e)}`)
    }

    // LOG PAYLOAD (Requested by user)
    console.log('Payload recebido:', JSON.stringify(reqBody))

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const { amount, returnUrl, completionUrl, customer } = reqBody

    // Validate Required Fields
    if (!amount) throw new Error('Campo faltando: amount')
    if (!customer) throw new Error('Campo faltando: customer')
    if (!customer.email) throw new Error('Campo faltando: customer.email')

    // Format Amount (Strict Integer Cents)
    const numericAmount = Number(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error(`Valor inválido: ${amount}`)
    }
    const valueInCents = Math.round(numericAmount * 100)
    console.log(`Amount Cents: ${valueInCents}`)

    // Format TaxID
    let cleanTaxId = customer.taxId ? String(customer.taxId).replace(/\D/g, '') : ''

    // Use ABACATEPAY_API_KEY from secrets
    const abacatePayKey = Deno.env.get('ABACATEPAY_API_KEY')
    if (!abacatePayKey) {
      // console.error('ABACATEPAY_API_KEY is not set') // Don't log secrets structure to client, just server log if needed
      throw new Error('Configuração de servidor: ABACATEPAY_API_KEY ausente')
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

    console.log('Enviando Payload para AbacatePay:', JSON.stringify(body))

    const response = await fetch('https://api.abacatepay.com/v1/billing/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${abacatePayKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    const responseText = await response.text()
    console.log(`AbacatePay Status: ${response.status}`)
    console.log('AbacatePay Resposta:', responseText)

    if (!response.ok) {
      // Return exact upstream error details
      throw new Error(`Erro AbacatePay: ${responseText}`)
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
    console.error('Edge Function CATCH:', error)
    // EXPLICIT ERROR RESPONSE
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        details: String(error)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
