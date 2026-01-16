import express from 'express';
import { postHistorico, getHistorico, getHistoricoPorProfissional } from '../controllers/HistoryController.js';

const router = express.Router();


router.post('/', postHistorico);         // Salvar ação
router.get('/', getHistorico);           // Pegar tudo (Dashboard Geral)
router.get('/:crm', getHistoricoPorProfissional); // Pegar ações de um médico específico

export default router;