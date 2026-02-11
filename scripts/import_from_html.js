import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

// Configuração básica para ler arquivos e conectar no banco
const __filename = fileURLToPath(import.meta.url);
const envPath = path.resolve(process.cwd(), '.env.local');
let supabaseUrl = '';
let supabaseKey = '';

// 1. Tenta carregar as chaves do arquivo .env.local
try {
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        for (const line of envConfig.split('\n')) {
            const [key, value] = line.split('=');
            if (key && value) {
                if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = value.trim();
                if (key.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseKey = value.trim();
            }
        }
    }
} catch (e) {
    console.error('⚠️ Aviso: Não foi possível ler .env.local automaticamente.');
}

// Validação simples
if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERRO CRÍTICO: Não encontrei VITE_SUPABASE_URL e CHAVE no .env.local');
    console.error('👉 Verifique se o arquivo .env.local existe na raiz do projeto.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    // 2. Tenta ler o arquivo HTML
    const htmlPath = path.resolve(process.cwd(), 'servicos_agencia.html');

    if (!fs.existsSync(htmlPath)) {
        console.error('❌ ARQUIVO NÃO ENCONTRADO!');
        console.error(`👉 O script procurou por: ${htmlPath}`);
        console.error('👉 Por favor, mova o arquivo "servicos_agencia.html" para a pasta raiz do projeto.');
        return;
    }

    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    console.log('✅ Arquivo HTML encontrado! Iniciando extração...');

    // 3. Regex Poderosa (Extrai ID e Descrição baseada nas tags do HTML)
    // Procura por data-favorite-service-id="NUMERO" ... até achar ... LINK EXAMPLE: TEXTO </div>
    const regex = /data-favorite-service-id="(\d+)"[\s\S]*?LINK EXAMPLE:\s*([\s\S]*?)<\/div>/g;

    let match;
    let count = 0;
    let successCount = 0;

    while ((match = regex.exec(htmlContent)) !== null) {
        const id = match[1];
        let description = match[2];

        // Limpeza do texto (Troca <br> por quebra de linha e remove tags extras)
        description = description
            .replace(/<br\s*\/?>/gi, '\n') // Troca <br> por enter
            .replace(/<\/?[^>]+(>|$)/g, "") // Remove outras tags HTML
            .trim();

        if (!description) continue; // Pula se estiver vazio

        process.stdout.write(`🔄 ID ${id}... `);

        // 4. Salva no Banco
        const { error } = await supabase
            .from('services')
            .update({ description: description })
            .eq('service_id', id); // IMPORTANTE: Usa service_id, não id!

        if (error) {
            console.log(`❌ Erro`);
        } else {
            console.log(`✅ OK`);
            successCount++;
        }
        count++;
    }

    console.log(`\n🎉 CONCLUÍDO! ${successCount} serviços foram atualizados com sucesso.`);
}

run();