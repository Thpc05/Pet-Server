import mongoose from 'mongoose';

const HistorySchema = new mongoose.Schema({
    descricao: { 
        type: String, 
        required: true 
    },
    id_profissional: { 
        type: String, 
        required: true 
    }, // Pode ser o CRM ou o _id
    nome_paciente: { 
        type: String, 
        default: 'Desconhecido' 
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    }
});

const HistoryModel = mongoose.model('History', HistorySchema);
export default HistoryModel;