import { Request, Response, NextFunction } from "express";
import { ObjectSchema, ValidationErrorItem } from "joi";

export default function validateRequest(schema: ObjectSchema) {
    return async function validator(
        req: Request,
        res: Response,
        next: NextFunction,
    ) {
        const { error, value } = await schema.validateAsync(req.body, { abortEarly: false });

        if (error) {
            return res.status(400).json({
                error: error.details.map((d: ValidationErrorItem) => d.message).join(', ')
            });
        };

        req.body = value;
        next();
    };
};