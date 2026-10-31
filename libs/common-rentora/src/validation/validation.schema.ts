
import Joi from 'joi';

export const validationSchema = Joi.object({
  JWT_SECRET1: Joi.string().required(),
  JWT_SECRET2: Joi.string().required(),

  ADMIN_SECRET1: Joi.string().required(),
  ADMIN_SECRET2: Joi.string().required(),

  PORT: Joi.number().required(),

  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),
  POSTGRES_DB: Joi.string().required(),
  POSTGRES_HOST: Joi.string().required(),
  POSTGRES_PORT: Joi.number().required(),

  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().required(),
  SMTP_SECURE: Joi.boolean().required(),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),

  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),

  SUPER_ADMIN: Joi.string().required(),

  OPENAI_API_KEY: Joi.string().required(),
  OPENAI_MODEL: Joi.string().required(),
});
