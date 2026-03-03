import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { RoleName } from "#types/index.js";
import logger from "#utils/logger.js";
import 'dotenv/config';

const JWT_SECRET = `${process.env.JWT_SECRET}` || '';
const JWT_REFRESH_TOKEN = `${process.env.JWT_REFRESH_TOKEN}` || '';

if (!JWT_SECRET) {
    throw new Error("ACCESS_TOKEN_SECRET is not set in environment variables");
};

if (!JWT_REFRESH_TOKEN) {
    throw new Error("REFRESH_TOKEN_SECRET is not set in environment variables");
};

export type AuthPayload = {
    id: number;
    role: RoleName;
};

interface AuthenticatedUser extends JwtPayload {
    id: number;
    role: RoleName;
};

function isAuthenticatedUser(obj: unknown): obj is AuthenticatedUser {
    if (!obj || typeof obj !== 'object') return false
    const asObj = obj as Record<string, unknown>;
    return (
        (typeof asObj.id === "number" || typeof asObj.id === "string") &&
        (typeof asObj.companyId === "number" || typeof asObj.companyId === "string") &&
        typeof asObj.role === "string" &&
        Object.values(RoleName).includes(asObj.role as RoleName)
    );
};

export function createAccessToken(payload: AuthPayload): string {
    if (
        !payload ||
        (typeof payload.id !== "number" && typeof payload.id !== "string") ||
        !payload.role
    ) {
        logger.error("Invalid payload passed to createAccessToken:", payload);
        throw new Error("Invalid payload for access token creation");
    }
    return jwt.sign(
        {
            id: Number(payload.id),
            role: payload.role,
        },
        JWT_SECRET,
        {
            expiresIn: "1h",
            algorithm: "HS256",
            issuer: "Wave Crafters",
        }
    );
};

export function createRefreshToken(payload: AuthPayload): string {
    if (
        !payload ||
        (typeof payload.id !== "number" && typeof payload.id !== "string") ||
        !payload.role
    ) {
        logger.error("Invalid payload passed to createRefreshToken:", payload);
        throw new Error("Invalid payload for refresh token creation");
    }
    return jwt.sign(
        {
            id: Number(payload.id),
            role: payload.role
        },
        JWT_REFRESH_TOKEN,
        {
            expiresIn: "7d",
            algorithm: "HS256",
            issuer: "Wave Crafters",
        }
    );
};

export function verifyAccessToken(token: string): AuthenticatedUser {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    if (typeof decoded === "string") {
        throw new jwt.JsonWebTokenError("Unexpected token payload type (string).");
    }
    if (!isAuthenticatedUser(decoded)) {
        logger.error("Access token decoded to unexpected shape:", decoded);
        throw new jwt.JsonWebTokenError("Invalid access token payload");
    }
    return {
        ...decoded,
        id: Number(decoded.id),
        companyId: Number(decoded.companyId),
        role: decoded.role as RoleName,
    } as AuthenticatedUser;
};

export function verifyRefreshToken(token: string): AuthenticatedUser {
    const decoded = jwt.verify(token, JWT_REFRESH_TOKEN, { algorithms: ["HS256"] });
    if (typeof decoded === "string") {
        throw new jwt.JsonWebTokenError("Unexpected token payload type (string).");
    }
    if (!isAuthenticatedUser(decoded)) {
        logger.error("Refresh token decoded to unexpected shape:", decoded);
        throw new jwt.JsonWebTokenError("Invalid refresh token payload");
    }
    return {
        ...decoded,
        id: Number(decoded.id),
        companyId: Number(decoded.companyId),
        role: decoded.role as RoleName,
    } as AuthenticatedUser;
};

function getTokenFromHeaderOrCookie(req: Request): string | null {
    const authHeader = (req.headers["authorization"] || req.headers["Authorization"]) as
        | string
        | undefined;
    if (authHeader) {
        const parts = authHeader.split(" ");
        if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
            return parts[1];
        }
    }
    if (req.cookies && req.cookies.access_token) {
        return req.cookies.access_token as string;
    }
    return null;
};

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
    const token = getTokenFromHeaderOrCookie(req);
    if (!token) {
        logger.warn("Token not provided on request:", { path: req.path, method: req.method });
        res.status(401).json({ msg: "Unauthorised. Please log in." });
        return;
    }
    try {
        const decoded = verifyAccessToken(token);
        req.user = decoded;
        next();
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            logger.info("Access token expired:", { path: req.path, method: req.method, message: err.message });
            return res.status(401).json({ msg: "Token has expired. Please login again." });
        }
        if (err instanceof jwt.JsonWebTokenError) {
            logger.warn("Invalid access token:", { path: req.path, method: req.method, message: err.message });
            return res.status(403).json({ msg: "Invalid token. Please login again." });
        }
        logger.error("Unexpected authentication error:", err);
        return res.status(403).json({ msg: "Authentication failed. Please try again." });
    }
};

export const requireRole = (requiredRole: RoleName): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthenticated" });
        }
        if (user.role !== requiredRole) {
            logger.warn(`User:${user.id} with role:${user.role} attempted access requiring role=${requiredRole}`);
            return res.status(403).json({ message: "Forbidden" });
        }
        return next();
    };
};

export function refreshAccessToken(refreshToken: string): { accessToken: string; payload: AuthenticatedUser } {
    const decoded = verifyRefreshToken(refreshToken);
    const newAccessToken = createAccessToken({
        id: Number(decoded.id),
        role: decoded.role as RoleName
    });
    return { accessToken: newAccessToken, payload: decoded };
}

export {
    AuthenticatedUser,
    getTokenFromHeaderOrCookie
};