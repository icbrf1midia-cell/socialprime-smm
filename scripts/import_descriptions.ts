
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables directly from .env.local
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
        console.error('❌ Arquivo dump_servicos.txt não encontrado!');
        return;
    }

    const content = fs.readFileSync(dumpPath, 'utf8');
    console.log('✅ Arquivo lido. Iniciando parse...');

    // Regex para capturar ID e Descrição
    // Padrão: ID (número) seguido de quebra de linha/espaço e "👉"
    // Captura até "LINK EXAMPLE:" e pega o conteúdo depois disso
    const regex = /(\d+)[\s\n]*👉[\s\S]*?LINK EXAMPLE:\s*([\s\S]*?)(?=\n\s*\d+[\s\n]*👉|$)/g;

    let match;
    let count = 0;

    while ((match = regex.exec(content)) !== null) {
        const id = match[1];
        let description = match[2].trim();

        // Se descrição for vazia ou parecer inválida, pular (opcional, user pediu pra manter o que vier)
        if (!description) {
            console.log(`⚠️ Serviço ID ${id}: Descrição vazia. Ignorando.`);
            continue;
        }

        console.log(`🔄 Atualizando ID ${id}...`);

        const { error } = await supabase
            .from('services')
            .update({ description: description })
            .eq('service_id', id); // Assumindo service_id como chave, confirmar schema se é 'id' ou 'service_id'

        if (error) {
            console.error(`❌ Erro ao atualizar ID ${id}:`, error.message);
        } else {
            console.log(`✅ ID ${id} atualizado com sucesso.`);
            count++;
        }
    }

    console.log(`\n🎉 Processo finalizado! ${count} serviços atualizados.`);
}

importDescriptions();
