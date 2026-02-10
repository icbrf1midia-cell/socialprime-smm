// TESTE NUCLEAR - SEM IMPORTS
console.log("Servidor Iniciado - Teste Nuclear");

Deno.serve(async (req) => {
    console.log("Recebi um chamado do Mercado Pago!");
    return new Response(JSON.stringify({ status: "Vivo" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
    });
});
