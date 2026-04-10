import { Module } from '@nestjs/common';
import { ActivityLoggerService } from './activity-logger.service';

@Module({
  imports: [],
  providers: [ActivityLoggerService],
  exports: [ActivityLoggerService],
})
export class ActivityLoggerModule {}
