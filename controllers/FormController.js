import { PacienteModel, FamiliaModel, ProfissionalModel } from '../models/FormModel.js';
import { spawn } from 'child_process';
import path from 'path';

// --- FUNÇÃO AUXILIAR (Mantida, mas usada apenas internamente) ---
const gerarPdfInterno = (dados) => {
    return new Promise((resolve, reject) => {
        // Ajuste o caminho para onde está seu script Python
        const scriptPath = path.resolve('python', 'geradorPDF.py');
        
        console.log("--- Iniciando processo Python ---");
        const pythonProcess = spawn('python3', [scriptPath]); // Tente 'python' se 'python3' falhar no Docker

        let resultado = '';
        let erro = '';

        // Envia o JSON
        pythonProcess.stdin.write(JSON.stringify(dados));
        pythonProcess.stdin.end();

        // Recebe logs e resultado
        pythonProcess.stdout.on('data', (data) => {
            resultado += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            erro += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Erro Python: ${erro}`);
                // Não damos reject aqui para não travar a API principal, 
                // apenas retornamos null
                resolve(null); 
            } else {
                try {
                    // Pega a última linha válida do output (JSON)
                    const lines = resultado.trim().split('\n');
                    const jsonStr = lines[lines.length - 1]; 
                    const resposta = JSON.parse(jsonStr);
                    
                    if (resposta.arquivos && resposta.arquivos.length > 0) {
                        resolve(resposta.arquivos[0]);
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    console.error("Erro ao ler resposta do Python:", e);
                    resolve(null);
                }
            }
        });
    });
};

// --- CONTROLLER ---

export const postForm = async (req, res) => {
  // ... (seu código de postForm continua idêntico ao que você já tinha)
  try {
    const { formType, ...formData } = req.body;
    // ... validações ...
    
    // ... Switch case para salvar ...

    // (Vou omitir o corpo do postForm aqui para focar na mudança do GET, 
    // mas mantenha o seu código de postForm como estava)
    
     res.status(201).json({ message: `Salvo com sucesso`, data: savedForm });

  } catch (error) {
     res.status(500).json({ message: "Erro" });
  }
};


/**
 * getFormById
 * 1. Busca os dados no Mongo.
 * 2. Manda gerar o PDF no Python (apenas gera, não retorna).
 * 3. Retorna o JSON original para o front.
 */
export const getFormById = async (req, res) => {
  try {
    const cpf = req.params.cpf;
  
    if (!cpf) {
      return res.status(400).json({ message: 'Faltou Cpf' });
    }
    
    // 1. Busca os dados (Usando .lean() para converter Mongoose Doc -> Objeto JS Puro)
    const [paciente, familiaForms, profissionalForms] = await Promise.all([
      PacienteModel.findOne({ cpf: cpf }).lean(),
      FamiliaModel.find({ cpf: cpf }).sort({ createdAt: -1 }).lean(),
      ProfissionalModel.find({ cpf: cpf }).sort({ createdAt: -1 }).lean()
    ]);

    if (!paciente) {
        // Se não achar paciente, retorna 404 e nem tenta gerar PDF
        return res.status(404).json({ 
            message: 'Paciente não encontrado',
            paciente: null,
            familia: [],
            profissional: []
        });
    }

    // 2. Tenta gerar o PDF em "segundo plano" (await para garantir que roda, mas sem travar resposta de erro)
    try {
        // Monta o objeto único que o Python espera (juntando tudo)
        const dadosCompletos = {
            ...paciente, // Espalha nome, cpf, etc na raiz
            familia: familiaForms,
            profissional: profissionalForms
        };

        // Chama o Python
        const caminhoPdfGerado = await gerarPdfInterno(dadosCompletos);
        
        if (caminhoPdfGerado) {
            console.log(`✅ PDF gerado com sucesso em: ${caminhoPdfGerado}`);
        } else {
            console.log("⚠️ Python rodou mas não retornou caminho do arquivo.");
        }

    } catch (pdfError) {
        // Se der erro no PDF, APENAS logamos. Não queremos que a API falhe para o usuário.
        console.error("❌ Erro ao tentar gerar PDF:", pdfError);
    }

    // 3. Retorno PADRÃO (JSON) como você pediu
    // O front-end nem vai saber que o PDF foi gerado lá no servidor
    res.status(200).json({
      paciente: paciente,
      familia: familiaForms,
      profissional: profissionalForms
    });

  } catch (error) {
    console.error("Erro no getFormById:", error);
    res.status(500).json({ message: "Erro do servidor ao pegar os formulários" });
  }
};