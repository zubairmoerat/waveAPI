import { prisma } from "#config/database.js";
import { User } from "../../generated/prisma/client.js";
import { RoleName } from "#types/index.js";
import { hashPassword, verifyPassword } from "#utils/password.utils.js";
import { encryptPhoneNumber } from "#utils/phoneNumberUtils.js";
import { AuthPayload, createAccessToken } from "#middleware/auth.js";
import logger from "#utils/logger.js";

async function signUpUser(
    data: { 
        name: string;
        email_address: string;
        password: string;
        phone_number: string;
        role: RoleName;
    }
):Promise <{ user: User, token: string }>{
    try{
        const encryption = await hashPassword(data.password);
        const phoneENC = await encryptPhoneNumber(data.phone_number);
        const user = await prisma.user.create({
            data: {
                name: data.name,
                email_address: data.email_address,
                passwordHash: encryption,
                phone_number: phoneENC,
                role: data.role
            }
        });

        const payload: AuthPayload = {
            id: user.id,
            role: user.role as RoleName
        };

        const token = createAccessToken(payload);

        return { user, token }
    }catch(error){
        logger.error('Error signing up:', error);
        throw Error('Unable to sign up.', { cause: error });
    }
};

async function loginUser(
    email_address: string, password: string
):Promise <{ user: User, token: string }>{
    try{
        const user = await prisma.user.findUnique({ where: { email_address } });
        if (!user) throw Error('Invalid Credentials.');
        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) throw Error('Invalid Credentials.');

        const payload: AuthPayload = {
            id: user.id,
            role: user.role as RoleName
        };

        const token = createAccessToken(payload);

        return { user, token };
    }catch(error){
        logger.error('Unable to login:', error);
        throw Error('Unable to login.', { cause: error });
    }
};

export {
    signUpUser,
    loginUser
};
