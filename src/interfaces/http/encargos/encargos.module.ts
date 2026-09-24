import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../../../infrastructure/infrastructure.module';
import { EncargosController } from './encargos.controller';

@Module({
  imports: [InfrastructureModule],
  controllers: [EncargosController],
})
export class EncargosModule {}