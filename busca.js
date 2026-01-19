const fs = require('fs');
const readline = require('readline');

// Interface para capturar dados do teclado
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Calcula a similaridade entre duas strings (0 a 100)
 * Lógica de Bigramas (Sørensen-Dice Coefficient)
 */
function calcularSimilaridade(text1, text2) {
    if (!text1 || !text2) return 0.0;

    const s1 = text1.toLowerCase().trim().replace(/\s+/g, '');
    const s2 = text2.toLowerCase().trim().replace(/\s+/g, '');

    if (s1 === s2) return 100.0;
    if (s1.length < 2 || s2.length < 2) return 0.0;

    // Função interna para gerar pares de letras (Bigramas)
    const getPairs = (str) => {
        const pairs = new Set();
        for (let i = 0; i < str.length - 1; i++) {
            pairs.add(str.substring(i, i + 2));
        }
        return pairs;
    };

    const pairs1 = getPairs(s1);
    const pairs2 = getPairs(s2);

    let intersection = 0;
    for (let pair of pairs1) {
        if (pairs2.has(pair)) {
            intersection++;
        }
    }

    const totalPairs = pairs1.size + pairs2.size;
    return (2.0 * intersection / totalPairs) * 100;
}

/**
 * Função principal de busca
 */
async function realizarBusca() {
    const caminhoArquivo = 'entrada.json';

    // 1. Verifica se o arquivo existe
    if (!fs.existsSync(caminhoArquivo)) {
        console.log(`Erro: O arquivo '${caminhoArquivo}' não foi encontrado.`);
        process.exit();
    }

    // 2. Captura entradas do usuário (usando Promise para simular o input do Python)
    const question = (str) => new Promise((resolve) => rl.question(str, resolve));

    console.log("\n--- Filtro de Busca de Paciente ---");
    const nomeInput = await question("Nome Completo: ");
    const nascInput = await question("Data de Nascimento (AAAA-MM-DD): ");
    const maeInput = await question("Nome da Mãe: ");

    // 3. Lê e processa o JSON
    try {
        const conteudo = fs.readFileSync(caminhoArquivo, 'utf-8');
        const bancoDados = JSON.parse(conteudo);

        let melhorMatch = null;
        let maiorScoreGeral = 0;

        bancoDados.forEach(paciente => {
            const nomeBanco = paciente.nome || '';
            const nascBanco = paciente.data_nascimento || '';
            const maeBanco = paciente.nome_da_mae || '';

            // Cálculos individuais
            const percNome = calcularSimilaridade(nomeInput, nomeBanco);
            const percMae = calcularSimilaridade(maeInput, maeBanco);
            const percNasc = (nascInput === nascBanco) ? 100.0 : 0.0;

            // Média Ponderada (Peso 2 para Nome, 1 para o resto)
            const scoreFinal = (percNome * 2 + percNasc + percMae) / 4;

            if (scoreFinal > maiorScoreGeral) {
                maiorScoreGeral = scoreFinal;
                melhorMatch = {
                    paciente: paciente,
                    concordancia: {
                        nome: `${percNome.toFixed(1)}%`,
                        data_nascimento: `${percNasc.toFixed(1)}%`,
                        nome_da_mae: `${percMae.toFixed(1)}%`,
                        total_geral: `${scoreFinal.toFixed(1)}%`
                    }
                };
            }
        });

        // 4. Resultado Final (Nota de corte 60%)
        if (melhorMatch && maiorScoreGeral >= 60) {
            console.log("\n✅ Paciente Encontrado!");
            console.log(JSON.stringify(melhorMatch, null, 4));
        } else {
            console.log("\n❌ Nenhum paciente encontrado com correspondência aceitável.");
            if (melhorMatch) {
                console.log(`(A maior correspondência foi de apenas ${maiorScoreGeral.toFixed(1)}%)`);
            }
        }

    } catch (err) {
        console.error("Erro ao processar o arquivo JSON:", err.message);
    } finally {
        rl.close();
    }
}

// Executa o script
realizarBusca();