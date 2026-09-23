import { Injectable, Logger } from '@nestjs/common';
import { MailSenderPort } from '../../domain/ports';
import { v4 as uuid } from 'uuid';

// esta será de momento para poder mockear
@Injectable()
export class ConsoleMailAdapter implements MailSenderPort {
  private readonly logger = new Logger('MailService');

  async enviar(params: {
    destinatario: string;
    asunto: string;
    cuerpo: string;
  }): Promise<{ messageId: string }> {
    const messageId = `mock-${uuid()}`;

    this.logger.log('════════════════════════════════════════');
    this.logger.log(`Para:    ${params.destinatario}`);
    this.logger.log(`Asunto:  ${params.asunto}`);
    this.logger.log(`ID:      ${messageId}`);
    this.logger.log('────────────────────────────────────────');
    this.logger.log(params.cuerpo);
    this.logger.log('════════════════════════════════════════');

    return { messageId };
  }
}