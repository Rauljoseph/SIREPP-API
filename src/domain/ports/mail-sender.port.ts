export interface MailSenderPort {
  enviar(params: {
    destinatario: string;
    asunto: string;
    cuerpo: string;
  }): Promise<{ messageId: string }>;
}

export const MAIL_SENDER = Symbol('MailSenderPort');