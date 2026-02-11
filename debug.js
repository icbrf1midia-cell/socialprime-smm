import fs from 'fs';
import path from 'path';

// Lê o arquivo
const dumpPath = path.resolve(process.cwd(), 'dump_servicos.txt');

if (!fs.existsSync(dumpPath)) {
    console.log("❌ O arquivo dump_servicos.txt NÃO foi encontrado na pasta raiz!");
} else {
    const content = fs.readFileSync(dumpPath, 'utf8');

    console.log("=== INÍCIO DO ARQUIVO (Primeiros 200 caracteres) ===");
    console.log(content.substring(0, 200));
    console.log("====================================================");

    // Teste para ver se acha o ID 479
    const teste479 = content.indexOf('479');
    console.log(`🔍 Procurando número '479': ${teste479 !== -1 ? 'ENCONTRADO ✅' : 'NÃO ACHEI ❌'}`);

    // Teste para ver se acha o separador
    const testeLink = content.indexOf('LINK EXAMPLE:');
    console.log(`🔍 Procurando termo 'LINK EXAMPLE:': ${testeLink !== -1 ? 'ENCONTRADO ✅' : 'NÃO ACHEI ❌'}`);

    // Teste do Emoji (muitas vezes ele quebra)
    const testeEmoji = content.indexOf('👉');
    console.log(`🔍 Procurando emoji '👉': ${testeEmoji !== -1 ? 'ENCONTRADO ✅' : 'NÃO ACHEI (Pode ser erro de encoding) ❌'}`);
}