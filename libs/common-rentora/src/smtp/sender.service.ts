
import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { resolve4 } from 'node:dns/promises';

import type { Transporter } from 'nodemailer';
import * as nodemailer from 'nodemailer';

import { IMailPayload, ISmtpConfig } from '../models';
import { TemplateService } from './template.service';

@Injectable()
export class SenderService implements OnModuleInit {
  private transporter: Transporter | null = null;

  private readonly logger = new Logger(SenderService.name);

  constructor(
    private readonly templateService: TemplateService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const smtp = this.configService.get<ISmtpConfig>('SMTP_CONFIG');

    if (!smtp) {
      throw new Error('SMTP_CONFIG is not loaded');
    }

    try {
      // Получаем актуальный IPv4-адрес Gmail
      const addresses = await resolve4(smtp.smtpHost);
      const smtpIpv4 = addresses[0];

      if (!smtpIpv4) {
        throw new Error(`No IPv4 address found for ${smtp.smtpHost}`);
      }

      this.logger.log(
        `SMTP resolved ${smtp.smtpHost} to IPv4`,
      );

      this.transporter = nodemailer.createTransport({
        host: smtpIpv4,
        port: smtp.smtpPort,
        secure: smtp.smtpSecure,
        requireTLS: true,

        // Сохраняем hostname для TLS certificate validation
        tls: {
          servername: smtp.smtpHost,
        },

        auth: {
          user: smtp.smtpUser,
          pass: smtp.smtpPassword,
        },

        // Ограничиваем время подключения
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 30000,
      });

      await this.transporter.verify();

      this.logger.log('SMTP transporter verified successfully');
    } catch (error: unknown) {
      this.transporter = null;

      this.logger.error(
        'SMTP initialization failed',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async sendEmail(payload: IMailPayload): Promise<boolean> {
    const transporter = this.transporter;

    if (!transporter) {
      this.logger.error('SMTP transporter is unavailable');
      return false;
    }

    const {
      to,
      subject,
      template,
      context,
      attachments,
      from,
    } = payload;

    const { html, error } = this.templateService.compile(
      template,
      context,
    );

    if (error) {
      this.logger.error(`Template compile failed: ${error}`);
      return false;
    }

    try {
      await transporter.sendMail({
        from,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        attachments,
      });

      this.logger.log('Email sent successfully');

      return true;
    } catch (error: unknown) {
      this.logger.error(
        'Email sending failed',
        error instanceof Error ? error.stack : String(error),
      );

      return false;
    }
  }
}
