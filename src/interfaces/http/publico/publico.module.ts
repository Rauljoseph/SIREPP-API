import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../../../infrastructure/infrastructure.module';
import { PublicoController } from './publico.controller';

@Module({
  imports: [InfrastructureModule],
  controllers: [PublicoController],
})
export class PublicoModule {}