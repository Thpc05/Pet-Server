import { PacienteModel, FamiliaModel, ProfissionalModel } from '../models/FormModel.js';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs'; // Importação necessária para manipular o arquivo após o download

// --- FUNÇÃO AUXILIAR (Mantida, mas usada apenas internamente) ---
const gerarPdfInterno = (dados) => {
    return new Promise((resolve, reject) => {
        // Ajuste o caminho para onde está seu script Python
        const scriptPath = path.resolve('python', 'geradorPDF.py');
        
        console.log("--- Iniciando processo Python ---");
        // Tente 'python' se 'python3' falhar no Docker.
        // Se a imagem for python:3.9-slim, geralmente 'python' funciona.
        const pythonProcess = spawn('python3', [scriptPath]); 

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

// --- CONTROLLERS ---

export const postForm = async (req, res) => {
  try {
    const { formType, ...formData } = req.body;
    console.log(`Recebido post para o tipo: ${formType}`);

    if (!formType) {
      return res.status(400).json({ message: 'O campo "formType" é obrigatório.' });
    }

    if (!formData.cpf) {
      return res.status(400).json({ message: 'Faltou Cpf' });
    }

    let savedForm;

    switch (formType) {
      case 'paciente':
        if (!formData.nome) return res.status(400).json({ message: 'Faltou Nome' });
        
        savedForm = await PacienteModel.findOneAndUpdate(
          { cpf: formData.cpf },
          { $set: formData },
          { new: true, upsert: true, runValidators: true }
        );
        break;

      case 'familia':
        if (!formData.grau_parentesco) return res.status(400).json({ message: 'Faltou Parentesco' });
        savedForm = await FamiliaModel.create(formData);
        break;

      case 'profissional':
        if (!formData.id_profissional) return res.status(400).json({ message: 'Faltou ID Profissional' });
        savedForm = await ProfissionalModel.create(formData);
        break;

      default:
        return res.status(400).json({ message: 'formType inválido.' });
    }

    res.status(201).json({
      message: `Formulário (${formType}) salvo com sucesso.`,
      data: savedForm
    });

  } catch (error) {
    console.error(`Erro no postForm:`, error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: "Erro de validação", errors: error.errors });
    }
    res.status(500).json({ message: "Erro do servidor" });
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

/**
 * downloadPdf
 * Novo método para fazer o download (streaming) do PDF para o cliente.
 * Endpoint sugerido: GET /api/form/download/:cpf
 */
export const downloadPdf = async (req, res) => {
    const cpf = req.params.cpf;

    if (!cpf) {
        return res.status(400).json({ message: 'CPF é obrigatório para download.' });
    }

    try {
        // 1. Busca os dados (mesma lógica do getFormById)
        const [paciente, familiaForms, profissionalForms] = await Promise.all([
            PacienteModel.findOne({ cpf: cpf }).lean(),
            FamiliaModel.find({ cpf: cpf }).sort({ createdAt: -1 }).lean(),
            ProfissionalModel.find({ cpf: cpf }).sort({ createdAt: -1 }).lean()
        ]);

        if (!paciente) {
            return res.status(404).json({ message: 'Paciente não encontrado.' });
        }

        // 2. Monta os dados para o Python
        const dadosCompletos = {
            ...paciente,
            familia: familiaForms,
            profissional: profissionalForms
        };

        // 3. Chama o Python para gerar o PDF e espera o caminho
        const caminhoPdf = await gerarPdfInterno(dadosCompletos);
        
        if (!caminhoPdf) {
             return res.status(500).json({ message: 'Falha ao gerar o arquivo PDF no servidor.' });
        }

        // 4. Faz o streaming do arquivo de volta para o cliente
        // Limpa o nome para evitar caracteres inválidos no header
        const nomeLimpo = paciente.nome ? paciente.nome.replace(/\s/g, '_') : 'Relatorio';
        const nomeArquivo = `${nomeLimpo}_${cpf}.pdf`;
        
        res.download(caminhoPdf, nomeArquivo, (err) => {
            if (err) {
                console.error("Erro no streaming do download:", err);
                // Se der erro no envio, pode ser que a conexão já tenha fechado
            }
            
            // Opcional: Deletar o arquivo do disco temporário do Render após o envio para economizar espaço
            try {
                fs.unlinkSync(caminhoPdf); 
                console.log(`Arquivo temporário deletado após download: ${caminhoPdf}`);
            } catch (unlinkErr) {
                console.warn(`Não foi possível deletar o arquivo temporário: ${unlinkErr}`);
            }
        });

    } catch (error) {
        console.error("Erro geral no downloadPdf:", error);
        res.status(500).json({ message: "Erro do servidor ao processar o download." });
    }
};