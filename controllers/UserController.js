import NewUserModel from '../models/UserModel.js';

// 1. Cadastrar (Register)
export const postNewUser = async (req, res) => {
    try {
        const { name, crm, email, password } = req.body;

        const userExists = await NewUserModel.findOne({ $or: [{ crm }, { email }] });

        if (userExists) {
            return res.status(400).json({ error: 'Usuário com este CRM ou Email já existe.' });
        }

        const user = await NewUserModel.create({
            name,
            crm,
            email,
            password 
            // history inicia vazio [] automaticamente pelo Model
        });

        return res.status(201).json({
            message: 'Usuário criado com sucesso!',
            user
        });

    } catch (error) {
        return res.status(500).json({ error: 'Erro ao criar usuário: ' + error.message });
    }
}

// 2. Logar (Login)
export const loginUser = async (req, res) => {
    try {
        const { crm, password } = req.body;

        const user = await NewUserModel.findOne({ crm });

        if (!user) {
            return res.status(404).json({ error: 'CRM não encontrado.' });
        }

        if (user.password !== password) {
            return res.status(401).json({ error: 'Senha incorreta.' });
        }

        return res.status(200).json({
            message: 'Login realizado com sucesso!',
            user 
        });

    } catch (error) {
        return res.status(500).json({ error: 'Erro no servidor: ' + error.message });
    }
}

// 3. Buscar Todos (Para o Dashboard)
export const getAllUsers = async (req, res) => {
    try {
        // Busca todos os usuários, ocultando a senha. 
        // O array 'history' virá embutido no retorno.
        const users = await NewUserModel.find({}, '-password').sort({ createdAt: -1 });
        return res.status(200).json(users);
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao buscar profissionais: ' + error.message });
    }
}

// 4. Adicionar Histórico (ATUALIZADO COM CPF)
export const addUserHistory = async (req, res) => {
    try {
        // Agora extraímos também o cpf_paciente
        const { id_profissional, descricao, nome_paciente, cpf_paciente, timestamp } = req.body;

        const user = await NewUserModel.findOne({ crm: id_profissional });

        if (!user) {
            return res.status(404).json({ error: 'Profissional não encontrado.' });
        }

        // Adiciona ao array com o CPF
        user.history.push({
            descricao,
            nome_paciente,
            cpf_paciente, // Salva o CPF no banco
            timestamp: timestamp || new Date()
        });

        await user.save();

        return res.status(201).json({ message: 'Histórico atualizado.' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao salvar histórico: ' + error.message });
    }
}

export const getUserHistory = async (req, res) => {
    try {
        const { crm } = req.params;
        const user = await NewUserModel.findOne({ crm }, 'history');
        
        if (!user) return res.status(404).json({ error: 'Profissional não encontrado.' });

        const sortedHistory = user.history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return res.status(200).json(sortedHistory);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}