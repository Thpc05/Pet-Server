import express from 'express';

import { postNewUser, loginUser } from '../controllers/UserController.js'; 

const UserRoutes = express.Router();

UserRoutes.post('/newUser', postNewUser);
UserRoutes.post('/loginUser', loginUser);


export default UserRoutes;
