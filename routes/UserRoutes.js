import express from 'express';

import { postNewUser, loginUser, getAllUsers, addUserHistory, getUserHistory } from '../controllers/UserController.js'; 

const UserRoutes = express.Router();

UserRoutes.post('/newUser', postNewUser);
UserRoutes.post('/loginUser', loginUser);
UserRoutes.get('/getAll', getAllUsers);
UserRoutes.post('/historico', addUserHistory);
UserRoutes.get('/historico/:crm', getUserHistory);


export default UserRoutes;
