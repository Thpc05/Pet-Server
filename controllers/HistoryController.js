import HistoryModel from '../models/HistoryModel.js';

// 1. Registrar Histórico (POST /historico)
export const postHistorico = async (req, res) => {
    try {
        const { descricao, id_profissional, nome_paciente, timestamp } = req.body;

        const newLog = await HistoryModel.create({
            descricao,
            id_profissional,
            nome_paciente,
            timestamp: timestamp || new Date()
        });

        return res.status(201).json({ 
            message: 'Histórico registrado!', 
            log: newLog 
        });

    } catch (error) {
        console.error("Erro ao salvar histórico:", error);
        return res.status(500).json({ error: 'Erro ao registrar histórico: ' + error.message });
    }
}

// 2. Buscar Histórico para o Dashboard (GET /historico)
export const getHistorico = async (req, res) => {
    try {
        // Busca todos os logs, ordenando do mais recente (-1)
        const logs = await HistoryModel.find().sort({ timestamp: -1 });
        
        return res.status(200).json(logs);
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao buscar histórico: ' + error.message });
    }
}

// 3. Buscar Histórico de um Profissional Específico (Opcional, útil pro futuro)
export const getHistoricoPorProfissional = async (req, res) => {
    try {
        const { crm } = req.params;
        const logs = await HistoryModel.find({ id_profissional: crm }).sort({ timestamp: -1 });
        return res.status(200).json(logs);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}