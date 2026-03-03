import { Request, Response, NextFunction } from "express";
import Joi, { ObjectSchema, ValidationErrorItem } from "joi";
import logger from "./logger.js";

export default function validateRequest(schema: ObjectSchema) {
    return async function validator(
        req: Request,
        res: Response,
        next: NextFunction,
    ) {
        logger.info(`Validator - req.body type: ${typeof req.body}, value: ${JSON.stringify(req.body)}`);

        if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                error: 'Request body is required and must contain data'
            });
        }

        try {
            const value = await schema.validateAsync(req.body, { abortEarly: false });
            logger.info(`Validator - Validated value: ${JSON.stringify(value)}`);
            req.body = value;
            next();
        } catch (error) {
            if ( error instanceof Joi.ValidationError ) {
                return res.status(400).json({
                    error: error.details.map((d: ValidationErrorItem) => d.message).join(', ')
                });
            }
            next(error);
        }
    };
};