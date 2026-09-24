import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../../../infrastructure/infrastructure.module';
import { ConsultaController } from './consulta.controller';

@Module({
  imports: [InfrastructureModule],
  controllers: [ConsultaController],
})
export class ConsultaModule {}