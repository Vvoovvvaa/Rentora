import { registerAs } from "@nestjs/config";
import { IDbcongif } from "../models";

export const dbconfig = registerAs("DBCONFIG", ():IDbcongif => {
    return{
        
        POSTGRES_USER:process.env.POSTGRES_USER as string,
        POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD as string,
        POSTGRES_DB: process.env.POSTGRES_DB as string,
        POSTGRES_HOST: process.env.POSTGRES_HOST as string,
        POSTGRES_PORT: Number(process.env.POSTGRES_PORT as string)

    }
})
