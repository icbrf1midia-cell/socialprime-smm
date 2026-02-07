
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const abacatePayKey = Deno.env.get('ABACATEPAY_API_KEY')

  if (!abacatePayKey) {
    return new Response(
      JSON.stringify({ error: "Missing API Key" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  return new Response(
    JSON.stringify({ message: "Key exists", keyLength: abacatePayKey.length }),
    { headers: { "Content-Type": "application/json" } },
  )
})
