import { Module } from '@nestjs/common';
import { EncargosModule } from './encargos/encargos.module';
import { HallazgosModule } from './hallazgos/hallazgos.module';
import { ReunificacionModule } from './reunificacion/reunificacion.module';
import { ConsultaModule } from './consulta/consulta.module';
import { TrazabilidadModule } from './trazabilidad/trazabilidad.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';

@Module({
  imports: [
    EncargosModule,
    HallazgosModule,
    ReunificacionModule,
    ConsultaModule,
    TrazabilidadModule,
    DashboardModule,
    NotificacionesModule,
  ],
})
export class InterfacesModule {}