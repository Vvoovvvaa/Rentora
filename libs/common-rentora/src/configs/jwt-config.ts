import { registerAs } from "@nestjs/config";
import { IJwtconfig } from "../models/jwt.config";

export const jwtconfig = registerAs("JWTCONFIG", (): IJwtconfig => {
    return{
            JWT_SECRET1: process.env.JWT_SECRET1 as string,
            JWT_SECRET2: process.env.JWT_SECRET2 as string,
            ADMIN_SECRET1: process.env.ADMIN_SECRET1 as string,
            ADMIN_SECRET2: process.env.ADMIN_SECRET2 as string
    }
})



