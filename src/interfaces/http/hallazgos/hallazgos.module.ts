import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../../../infrastructure/infrastructure.module';
import { HallazgosController } from './hallazgos.controller';

@Module({
  imports: [InfrastructureModule],
  controllers: [HallazgosController],
})
export class HallazgosModule {}