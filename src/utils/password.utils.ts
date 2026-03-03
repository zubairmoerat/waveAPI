import * as bcrypt from 'bcrypt';

const DEFAULT_SALT_ROUNDS = 1;

const getSaltRounds = (): number => {
    const v = process.env.BCRYPT_SALT_ROUNDS;
    if (!v) return DEFAULT_SALT_ROUNDS;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_SALT_ROUNDS
};

export async function hashPassword(password: string): Promise <string> {
    if (typeof password !== "string" || password.length === 0) {
        throw new TypeError("password must be a non-empty string");
    }
    const rounds = getSaltRounds();
    const salt = await bcrypt.genSalt(rounds);
    return await bcrypt.hash(password, salt);
};

export async function verifyPassword(
    password: string,
    hashed: string
): Promise<boolean> {
    if (typeof password !== "string" || typeof hashed !== "string") {
        throw new TypeError("password and hashed must be strings");
    }
    if (hashed.length === 0) return false;
    return await bcrypt.compare(password, hashed);
};