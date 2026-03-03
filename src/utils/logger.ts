import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import 'dotenv/config';

const logLevels = {
    error: 0,
    warning: 1,
    info: 2,
    http: 3,
    debug: 4,
};

type LogLevel = keyof typeof logLevels;

const config = {
    loglevel: `${process.env.LOG_LEVEL}` as LogLevel
}

const logger = winston.createLogger({
    levels: logLevels,
    level: config.loglevel,
    format: winston.format.combine(
        winston.format.errors({ stack: true }),
        winston.format.timestamp({
            format: 'YYYY-MM-DD hh:mm:ss A'
        }),
        winston.format.printf(
            ({ timestamp, level, message, logMetadata, stack }) => {
                return `${timestamp} ${level}: ${logMetadata || ""} ${message} ${stack || ""}`;
            }
        ),
    ),
    transports: [new winston.transports.Console()],
});

const fileRotateTransport = new DailyRotateFile({
    filename: "logs/application-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
    format: winston.format.combine(
        winston.format.errors({ stack: true }),
        winston.format.timestamp(),
        winston.format.json(),
    ),
});
logger.add(fileRotateTransport);

export default logger;