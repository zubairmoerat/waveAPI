import Joi from "joi";

// Auth
export const signupSchema = Joi.object({
    name: Joi.string().required(),
    email_address: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    phone_number: Joi.string().required(),
    role: Joi.string().required(),
});

export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});