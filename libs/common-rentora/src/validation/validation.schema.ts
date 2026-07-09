import Joi from "joi";

export const validationSchema = Joi.object({
    JWT_SECRET1: Joi.string().required(),
    JWT_SECRET2: Joi.string().required(),
    ADMIN_SECRET1: Joi.string().required(),
    ADMIN_SECRET2: Joi.string().required(),
    PORT: Joi.number().required()


})



