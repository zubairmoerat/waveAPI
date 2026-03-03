import express, { Express, Request, Response } from "express";
import { fileURLToPath } from "url";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
// routes
import authRouter from "#routes/auth.router.js";
// ---
import errorHandler from "#middleware/errorHandler.js";
import logger from "#utils/logger.js";
import 'dotenv/config';

const app: Express = express();
const PORT = process.env.PORT;

app.use(helmet());

app.use(cors({
    origin: process.env.CORS_ORIGIN || `http://localhost:${PORT}`,
    credentials: true,
    methods: [ 'GET', 'POST', 'PUT', 'DELETE', 'OPTIONS' ],
    allowedHeaders: [ 'Content-Type','Authorization','X-Requested-With','Accept' ],
    exposedHeaders: [ 'Authorization' ]
}));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
};

app.use(
    express.json(),
    express.urlencoded({ extended: true }),
);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const staticPath = path.resolve(__dirname, "./static");

app.use(express.static(staticPath));

app.get(/^\/$|\/API/, (req, res) => {
    res.status(200).sendFile(path.join(staticPath, "index.html"));
});

app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

app.use('/api/auth', authRouter);

app.use(( req: Request, res: Response ) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
        method: req.method,
    });
});

// error
app.use(errorHandler);

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Server URL: http:/localhost:${PORT}`);
    console.log(`Health Check: http:/localhost:${PORT}/health`);
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});
