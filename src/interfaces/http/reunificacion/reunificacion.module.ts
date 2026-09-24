import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../../../infrastructure/infrastructure.module';
import { ReunificacionController } from './reunificacion.controller';

@Module({
  imports: [InfrastructureModule],
  controllers: [ReunificacionController],
})
export class ReunificacionModule {}