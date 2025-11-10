import express from 'express';

import { postForm, getFormById } from '../controllers/FormController.js'; 

const FormsRoutes = express.Router();

FormsRoutes.post('/postForm', postForm);
FormsRoutes.get('/getForm/:cpf', getFormById);

export default FormsRoutes;
