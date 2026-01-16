import mongoose from 'mongoose';

// Schema para os itens individuais do histórico (Embutido)
const HistoryItemSchema = new mongoose.Schema({
    descricao: { 
        type: String, 
        required: true 
    },
    nome_paciente: { 
        type: String, 
        default: 'Desconhecido' 
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    }
});

const NewUserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    crm: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    history: {
        type: [HistoryItemSchema],
        default: [] 
    }
});

const NewUserModel = mongoose.model('NewUser', NewUserSchema);

export default NewUserModel;