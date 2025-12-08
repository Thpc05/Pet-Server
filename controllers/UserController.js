import NewUserModel from '../models/UserModel.js';

// 1. Cadastrar (Register)
export const postNewUser = async (req, res) => {
    try {
        const { name, crm, email, password } = req.body;

        // Verifica duplicidade
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
        // console.log(error) // Dica: use isso para ver o erro real no terminal se der pau de novo
        return res.status(500).json({ error: 'Erro ao criar usuário: ' + error.message });
    }
}

// 2. Logar (Login)
export const loginUser = async (req, res) => {
    try {
        const { crm, password } = req.body;

        // CORREÇÃO AQUI: Usar NewUserModel, não NewUser
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