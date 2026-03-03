import { Request, Response, NextFunction } from "express";
import logger from "#utils/logger.js";

interface AppError extends Error {
    statusCode?: number;
    status?: number
};

function errorHandler( err: AppError, req: Request, res: Response, next: NextFunction ){
    if(err){
        const statusCode = err.statusCode || err.status || 500;
        logger.error(
            `${req.method} ${req.originalUrl} - ${err.message}`,
            {
                logMetadata: {
                    status: statusCode,
                    stack: err.stack
                }
            }
        );
        res.status(statusCode).json({
            status: statusCode,
            message: err.message || 'Internal Server Error.'
        });
    }else{
        next();
    }
};

export default errorHandler;