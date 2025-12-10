import express from 'express';

// 1. Adicione o downloadPdf na importação
import { postForm, getFormById, downloadPdf } from '../controllers/FormController.js'; 

const FormsRoutes = express.Router();

FormsRoutes.post('/postForm', postForm);

// Rota para pegar os DADOS (JSON) para exibir na tela
FormsRoutes.get('/getForm/:cpf', getFormById);

// 2. Nova Rota para BAIXAR O ARQUIVO (PDF)
FormsRoutes.get('/getPdf/:cpf', downloadPdf);

export default FormsRoutes;