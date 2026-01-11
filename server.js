// APIMongo/server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import { connectDB } from './config/MongoDB.js';

import FormsRoutes from './routes/FormRoutes.js';
import UserRoutes from './routes/UserRoutes.js';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors()); 

// Usar as rotas
app.use('/db/forms', FormsRoutes);
app.use('/db/user', UserRoutes)

// Status
app.get('/status', (req, res) => {
  console.log('Req de status recebida')
  res.send('ok');
});

connectDB();

const PORT = process.env.PORT || 3050;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});