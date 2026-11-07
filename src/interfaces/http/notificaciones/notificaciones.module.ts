import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../../../infrastructure/infrastructure.module';
import { NotificacionController } from './notificaciones.controller';

@Module({
  imports: [InfrastructureModule],
  controllers: [NotificacionController],
})
export class NotificacionesModule {}