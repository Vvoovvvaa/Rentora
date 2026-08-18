import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Transporter } from 'nodemailer';
import * as nodemailer from 'nodemailer';

import { IMailPayload, ISmtpConfig } from '../models';
import { TemplateService } from './template.service';

@Injectable()
export class SenderService implements OnModuleInit {
  private transporter!: Transporter;

  constructor(
    private readonly templateService: TemplateService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const smtp = this.configService.get<ISmtpConfig>('SMTP_CONFIG');

    if (!smtp) {
      throw new Error('SMTP_CONFIG is not loaded');
    }

    this.transporter = nodemailer.createTransport({
      host: smtp.smtpHost,
      port: smtp.smtpPort,
      secure: smtp.smtpSecure,
      requireTLS: true,
      auth: {
        user: smtp.smtpUser,
        pass: smtp.smtpPassword,
      },
    });

    try {
      await this.transporter.verify();

      console.log('SMTP transporter verified');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      console.error('SMTP verification failed:', message);
    }
  }

  async sendEmail(payload: IMailPayload): Promise<boolean> {
    const { to, subject, template, context, attachments, from } = payload;

    const { html, error } = this.templateService.compile(template, context);

    if (error) {
      console.error(`[EMAIL] Template compile failed: ${error}`);

      return false;
    }

    try {
      await this.transporter.sendMail({
        from,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        attachments,
      });

      console.log('Email sent to:', Array.isArray(to) ? to.join(', ') : to);

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      console.error(`[EMAIL] Error sending email: ${message}`);

      return false;
    }
  }
}
