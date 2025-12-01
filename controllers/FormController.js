// Importa os 3 novos Modelos
import { PacienteModel, FamiliaModel, ProfissionalModel } from '../models/FormModel.js';

/**
 * postForm
 * Salva um formulário. Ele espera um campo "formType" no req.body
 * para diferenciar entre 'paciente', 'familia', e 'profissional'.
 */
export const postForm = async (req, res) => {
  try {
    // Desestrutura o formType para fora do formData
    const { formType, ...formData } = req.body;
    console.log(`Recebido post para o tipo: ${formType}`);

    // Validação do Tipo
    if (!formType) {
      return res.status(400).json({ message: 'O campo "formType" (paciente, familia, ou profissional) é obrigatório.' });
    }

    // Validação do CPF (necessário para todos os tipos)
    if (!formData.cpf) {
      return res.status(400).json({ message: 'Faltou Cpf' });
    }

    let savedForm;

    switch (formType) {
      // --- Caso 1: PACIENTE ---
      // Usa 'findOneAndUpdate' com 'upsert' para criar ou atualizar o paciente principal.
      case 'paciente':
        if (!formData.nome) {
          return res.status(400).json({ message: 'Faltou Nome para o paciente' });
        }
        
        const filter = { cpf: formData.cpf };
        const dataToSet = { $set: formData };
        const options = {
          new: true,
          upsert: true, // Cria o paciente se ele não existir
          runValidators: true,
        };

        savedForm = await PacienteModel.findOneAndUpdate(filter, dataToSet, options);
        break;

      // --- Caso 2: FAMILIA ---
      // Usa '.create()' para adicionar um NOVO formulário de família.
      case 'familia':
        if (!formData.grau_parentesco) {
          return res.status(400).json({ message: 'Faltou o Grau de Parentesco' });
        }
        // Garante que o CPF está no objeto
        formData.cpf = formData.cpf;
        savedForm = await FamiliaModel.create(formData);
        break;

      // --- Caso 3: PROFISSIONAL ---
      // Usa '.create()' para adicionar um NOVO formulário profissional.
      case 'profissional':
        if (!formData.id_profissional) {
          return res.status(400).json({ message: 'Faltou o ID do Profissional' });
        }
        // Garante que o CPF está no objeto
        formData.cpf = formData.cpf;
        savedForm = await ProfissionalModel.create(formData);
        break;

      default:
        return res.status(400).json({ message: 'formType inválido. Use "paciente", "familia" ou "profissional".' });
    }

    // Deu Bom
    res.status(201).json({
      message: `Formulário (${formType}) salvo com sucesso.`,
      data: savedForm
    });

  } catch (error) {
    console.error(`Erro no postForm (tipo: ${req.body.formType}):`, error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: "Erro de validação",
        errors: error.errors
      });
    }
    res.status(500).json({ message: "Erro do servidor ao salvar o formulário" });
  }
};

/**
 * getFormById (Get por CPF)
 * Busca os dados do paciente, a lista de forms da família e a
 * lista de forms profissionais, todos vinculados a um único CPF.
 */
export const getFormById = async (req, res) => {
  try {
    const cpf = req.params.cpf;
  
    if (!cpf) {
      return res.status(400).json({ message: 'Faltou Cpf' });
    }
    console.log(`Buscando dados para o CPF: ${cpf}`);

    // Busca os 3 tipos de dados em paralelo
    const [paciente, familiaForms, profissionalForms] = await Promise.all([
      PacienteModel.findOne({ cpf: cpf }),
      FamiliaModel.find({ cpf: cpf }).sort({ createdAt: -1 }), // .find() retorna array (Muitos)
      ProfissionalModel.find({ cpf: cpf }).sort({ createdAt: -1 }) // .find() retorna array (Muitos)
    ]);

    // Deu Bom - Retorna o objeto composto que o Flutter espera
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