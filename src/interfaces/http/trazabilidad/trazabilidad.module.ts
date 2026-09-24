import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../../../infrastructure/infrastructure.module';
import { TrazabilidadController } from './trazabilidad.controller';

@Module({
  imports: [InfrastructureModule],
  controllers: [TrazabilidadController],
})
export class TrazabilidadModule {}