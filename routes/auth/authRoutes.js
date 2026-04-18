//Backend\routes\auth\authRoutes.js
import express from 'express';


import { register , login , googleSignup, googleLogin, otpRegister } from "../../controllers/user/authController.js";
const router = express.Router();

 
router.post('/register' , register);

router.post('/otpregister' , otpRegister);

router.post('/resend'  , register);

router.post('/login' , login);

router.post('/google', googleSignup);

router.post('/google/login' , googleLogin);


export default router;