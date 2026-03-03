import express, { Router } from "express";
import { signUp, LogIn } from "#controllers/auth.contoller.js";
import validateRequest from "#utils/validators.js";
import { signupSchema, loginSchema } from "#config/validationSchema.js";

const authRouter: Router = express.Router();

authRouter.post('/login',validateRequest(loginSchema)  , LogIn);
authRouter.post('/sign-up', validateRequest(signupSchema), signUp);

export default authRouter;