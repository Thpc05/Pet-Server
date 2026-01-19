import mongoose from 'mongoose';

// --- 1. Schema do Paciente (O que você enviou) ---
// Este schema armazena os dados principais e únicos do paciente.
const pacienteSchema = new mongoose.Schema({
  // Informações Pessoais
  nome: {
    type: String,
    required: true,
  },
  data_nascimento: {
    type: Date
  },
  nome_da_mae: {
    type: String
  },
  cpf: {
    type: String,
    unique: true, // Correto! Só pode haver UM paciente por CPF.
    required: true,
    index: true, // Bom para performance de busca
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
  
  historico_avc_anterior: {
    type: Boolean,
  },
  historico_avc_anterior_detalhes: {
    type: String, // "Quando, qual tipo, etc."
  },

  // --- CAMPOS ADICIONADOS ---
  procedimentos_invasivos: {
    type: String, // Checkboxes: "traqueostomia, entubamento, trombectomia..."
  },
  // --------------------------
  
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
    type: String, // "Filho(a)", "Cônjuge", etc. (Provavelmente do cuidador principal)
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

  // --- CAMPO ADICIONADO ---
  acompanhamento_profissional: {
    type: String, // Checkboxes: "cardiologista, fisioterapeuta..."
  },
  // --------------------------

  uso_medicamentos: {
    type: String,
  },
  uso_medicamentos_qual: {
    type: String,
  },
  
}, {
  timestamps: true,
});

// --- 2. Schema da Família (Novo) ---
// Armazena MÚLTIPLOS formulários de acompanhamento da família.
const familiaSchema = new mongoose.Schema({
  cpf: {
    type: String,
    required: true,
    index: true, // Chave para buscar todos os forms deste CPF
  },
  grau_parentesco: { // Quem preencheu
    type: String,
    required: true,
  },
  data_observacao: {
    type: Date,
    default: Date.now,
  },
  humor_paciente: {
    type: String, // Ex: "Estável", "Irritado", "Apático"
  },
  dificuldades_observadas: { // Múltipla escolha
    type: [String], // Ex: ["Alimentação", "Mobilidade", "Fala"]
  },
  observacoes_gerais: {
    type: String, // Um campo de texto livre
  },
  sinais_alerta: {
    type: String, // Ex: "Febre", "Tosse persistente"
  },
}, {
  timestamps: true,
});

// --- 3. Schema do Profissional (Novo) ---
// Armazena MÚLTIPLOS formulários de atendimento profissional.
const profissionalSchema = new mongoose.Schema({
  cpf: {
    type: String,
    required: true,
    index: true, // Chave para buscar todos os forms deste CPF
  },
  id_profissional: { // ID ou CRM do profissional
    type: String,
    required: true,
  },
  nome_profissional: {
    type: String,
  },
  data_atendimento: {
    type: Date,
    default: Date.now,
  },
  tipo_atendimento: {
    type: String, // Ex: "Fisioterapia", "Fonoaudiologia", "Clínico Geral"
  },
  evolucao_paciente: {
    type: String, // Texto livre sobre a evolução
  },
  sinais_vitais: {
    type: String, // Ex: "PA: 120/80, BPM: 70"
  },
  ajustes_medicacao: {
    type: String, // "Manter medicação", "Ajustar dosagem de..."
  },
  plano_tratamento_continuacao: {
    type: String, // Próximos passos
  },
}, {
  timestamps: true,
});


// --- Criação e Exportação dos Modelos ---

// O Mongoose criará coleções no plural: "pacientes", "familias", "profissionais"
const PacienteModel = mongoose.model('Paciente', pacienteSchema);
const FamiliaModel = mongoose.model('Familia', familiaSchema);
const ProfissionalModel = mongoose.model('Profissional', profissionalSchema);

export { PacienteModel, FamiliaModel, ProfissionalModel };