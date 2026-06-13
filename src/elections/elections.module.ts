import { Module } from '@nestjs/common';
import { ElectionsController } from './elections.controller';
import { ElectionsService } from './elections.service';

@Module({
  controllers: [ElectionsController],
  providers: [ElectionsService],
  exports: [ElectionsService], // Export it in case other modules need to check vote statuses later
})
export class ElectionsModule {}
