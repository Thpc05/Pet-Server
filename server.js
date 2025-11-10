// APIMongo/server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import { connectDB } from './config/MongoDB.js';

import FormsRoutes from './routes/FormRoutes.js'; 

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors()); 

  // Usar as rotas
app.use('/db/forms', FormsRoutes);

connectDB();

const PORT = process.env.PORT || 3050;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${process.env.PORT}`);
});