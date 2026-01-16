import NewUserModel from '../models/UserModel.js';
import HistoryModel from '../models/HistoryModel.js';

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

// 3. Buscar Todos (NOVO - Dashboard)
export const getAllUsers = async (req, res) => {
    try {
        // Busca todos os usuários, ocultando o campo password
        const users = await NewUserModel.find({}, '-password').sort({ createdAt: -1 });
        return res.status(200).json(users);
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao buscar profissionais: ' + error.message });
    }
}