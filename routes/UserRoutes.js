import express from 'express';

import { postNewUser, loginUser, getAllUsers } from '../controllers/UserController.js'; 

const UserRoutes = express.Router();

UserRoutes.post('/newUser', postNewUser);
UserRoutes.post('/loginUser', loginUser);
UserRoutes.get('/getAll', getAllUsers); // Nova rota GET


export default UserRoutes;
