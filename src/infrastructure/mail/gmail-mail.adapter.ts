import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailSenderPort } from '../../domain/ports';

@Injectable()
export class GmailMailAdapter implements MailSenderPort {
  private readonly logger = new Logger('MailService');
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.from = this.config.get<string>('MAIL_FROM', 'SIREPP <sirepp.notificaciones@gmail.com>');

    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('MAIL_HOST', 'smtp.gmail.com'),
      port: this.config.get<number>('MAIL_PORT', 587),
      secure: false,
      auth: {
        user: this.config.get<string>('MAIL_USER'),
        pass: this.config.get<string>('MAIL_PASS'),
      },
    });

    // Verificar conexión al iniciar
    this.transporter.verify()
      .then(() => this.logger.log('Conexión SMTP con Gmail establecida'))
      .catch((err) => this.logger.error('Error al conectar con Gmail SMTP:', err.message));
  }

  async enviar(params: {
    destinatario: string;
    asunto: string;
    cuerpo: string;
  }): Promise<{ messageId: string }> {
    const info = await this.transporter.sendMail({
      from: this.from,
      to: params.destinatario,
      subject: params.asunto,
      text: params.cuerpo,
    });

    this.logger.log(`Correo enviado a ${params.destinatario} — ID: ${info.messageId}`);

    return { messageId: info.messageId };
  }
}