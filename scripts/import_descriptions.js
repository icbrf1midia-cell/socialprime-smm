import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega as variáveis de ambiente
const envPath = path.resolve(process.cwd(), '.env.local');
let supabaseUrl = '';
let supabaseKey = '';

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

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não encontrados no .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importDescriptions() {
    const dumpPath = path.resolve(process.cwd(), 'dump_servicos.txt');

    if (!fs.existsSync(dumpPath)) {
        console.error('❌ Arquivo dump_servicos.txt não encontrado na raiz!');
        return;
    }

    const content = fs.readFileSync(dumpPath, 'utf8');
    console.log('✅ Arquivo lido. Iniciando atualização em massa...');

    // --- CORREÇÃO AQUI ---
    // Adicionei \s* no começo para aceitar espaços antes do número
    const regex = /\s*(\d+)[\s\n]*👉[\s\S]*?LINK EXAMPLE:\s*([\s\S]*?)(?=\s*\d+[\s\n]*👉|$)/g;

    let match;
    let count = 0;

    while ((match = regex.exec(content)) !== null) {
        const id = match[1];
        let description = match[2].trim();

        if (!description || description === 'Dados insuficientes') {
            // Se quiser salvar mesmo com dados insuficientes, remova o "continue"
            continue;
        }

        // console.log(`🔄 Processando ID ${id}...`); // Comentei para limpar o log

        const { error } = await supabase
            .from('services')
            .update({ description: description })
            .eq('service_id', id); // Usando a coluna correta 'service_id'

        if (error) {
            console.error(`❌ Erro ID ${id}:`, error.message);
        } else {
            process.stdout.write(`✅ ${id} `); // Log mais limpo na mesma linha
            count++;
        }
    }

    console.log(`\n\n🎉 SUCESSO! ${count} serviços foram atualizados no Banco de Dados!`);
}

importDescriptions();