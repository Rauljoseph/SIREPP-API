import { Module } from '@nestjs/common';
import { DashboardController } from './dashboar.controller';

@Module({
  controllers: [DashboardController],
})
export class DashboardModule {}