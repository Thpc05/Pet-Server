import mongoose from 'mongoose';

// Este é o Schema principal para o seu formulário de paciente/AVC
const formSchema = new mongoose.Schema({
  // Informações Pessoais
  nome: {
    type: String,
    required: true,
  },
  cpf: {
    type: String,
    unique: true,
  },
  sexo: {
    type: String,
  },
  faixa_etaria: {
    type: String,
  },
  tipo_usuario: {
    type: String,
  },
  data_registro: {
    type: Date,
    default: Date.now,
  },

  // Informações Clínicas
  data_inicio_sintomas: {
    type: Date,
  },
  data_avc: {
    type: Date,
  },
  tipo_avc: {
    type: String,
  },
  admissao_janela_terapeutica: {
    type: Boolean,
  },
  trombolise: {
    type: Boolean,
  },
  trombectomia: {
    type: Boolean,
  },
  medicamentos_utilizados: {
    type: String, // "AAS, Clopidogrel"
  },
  
  // Suporte Hospitalar
  ventilacao_mecanica: {
    type: Boolean,
  },
  tempo_ventilacao: {
    type: String, // Pode ser "72 horas", "5 dias", etc.
  },
  intubado: {
    type: Boolean,
  },
  traqueostomizado: {
    type: Boolean,
  },
  
  // Acontecimentos
  sequelas: {
    type: String, // "Leve déficit motor braço direito"
  },
  desfecho: {
    type: String, // "Alta", "Óbito", "Transferência"
  },
  alta_medicamento: {
    type: Boolean,
  },
  alta_medicamento_qual: {
    type: String, // "AAS"
  },

  // Informações Adicionais
  grau_parentesco: {
    type: String, // "Filho(a)", "Cônjuge", etc.
  },
  cuidador_externo: {
    type: String, // Nome do cuidador ou "Sim"/"Não"
  },
  tempo_chegada_hospital: {
    type: String, // Ex: "3 horas"
  },

  // Histórico e Comorbidades
  comorbidades: {
    type: String, // "Hipertensão, Diabetes"
  },
  historico_familiar: {
    type: String, // "Pai com AVC"
  },
  medicamento_uso_diario: {
    type: Boolean,
  },
  medicamento_uso_diario_qual: {
    type: String, // "Losartana"
  },

  // Hábitos de Vida
  alimentacao: {
    type: String, // "Equilibrada"
  },
  atividade_fisica: {
    type: String, // "2x/semana"
  },
  tabagismo: {
    type: String, // "Sim", "Não", "Ex-fumante"
  },
  alcool: {
    type: String, // "Socialmente", "Diariamente", "Não"
  },

  uso_medicamentos: {
    type: String,
  },
  uso_medicamentos_qual: {
    type: String,
  },
  
}, {
  // Datas de modificação
  timestamps: true,
});

const FormModel = mongoose.model('Form', formSchema);

export default FormModel;
