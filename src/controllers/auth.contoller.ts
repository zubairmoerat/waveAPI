import { Request, Response, NextFunction } from "express";
import { signUpUser, loginUser } from "#services/auth.service.js";
import logger from "#utils/logger.js";

export const signUp = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const { name, email_address, password, phone_number, role } = req.body;
        const result = await signUpUser({
            name,
            email_address,
            password,
            phone_number,
            role
        });
        res.status(201).json({
            status: res.statusCode,
            user: result,
            message: 'Account successfully created.'
        });
    }catch(error){
        logger.error('Auth Controller - Error signing up:', error);
        next(error);
    }
};

export const LogIn = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const { email_address, password } = req.body;
        const result = await loginUser(email_address, password);
        res.status(200).json({
            staus: res.statusCode,
            user: result,
            message: 'Successfully logged in.'
        })
    }catch(error){
        logger.error('Auth Controller - Error logging in:', error);
        next(error);
    }
};