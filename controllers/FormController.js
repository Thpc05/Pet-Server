// FormController

// Importa o Model
import FormModel from '../models/FormModel.js';

export const postForm = async (req, res) => {
  console.log("Função executada");
  try {
    const formData = req.body;
    console.log(formData);

    // Nome
    if (!formData.nome) {
      return res.status(400).json({ message: 'Faltou Nome' });
    }
    // Cpf
    if (!formData.cpf) {
        return res.status(400).json({ message: 'Faltou Cpf' });
    }
    
    // Chave de busca
    const filter = { cpf: formData.cpf }; 
    
    const dataToSet = { $set: formData };
    
    const options = {
      new: true,
      upsert: true, // Cria o documento se ele não existir
      runValidators: true, // Roda as validações do Model
    };

    // Tenta Salvar no mongo
    const savedForm = await FormModel.findOneAndUpdate(
      filter, 
      dataToSet, 
      options
    );

    // Deu Bom
    res.status(201).json({ 
      message: "Form Salvo com sucesso.",
      data: savedForm 
    });

  } catch (error) {
    console.error("Erro no postForm:", error);
    
    // Não colocou nome, cpf ou otros erros de formatação
    if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          message: "Erro de validação", 
          errors: error.errors 
        });
    }
    // Erro
    res.status(500).json({ message: "Erro do servidor ao salvar o formulário" });
  }
};