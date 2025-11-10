import express from 'express';

import { postForm } from '../controllers/FormController.js'; 

const FormsRoutes = express.Router();

FormsRoutes.post('/postForm', postForm);

export default FormsRoutes;
