import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { CalendarReminderJob } from './jobs/calendar-reminder.job';
import { RecordingProcessorJob } from './jobs/recording-processor.job';
import { NotificationsModule } from '../notifications/notifications.module';
import { TeamAtOnceWebSocketModule } from '../../websocket/websocket.module';
import { CommunicationModule } from '../teamatonce/communication/communication.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    NotificationsModule,
    TeamAtOnceWebSocketModule,
    forwardRef(() => CommunicationModule),
  ],
  providers: [SchedulerService, CalendarReminderJob, RecordingProcessorJob],
  exports: [SchedulerService],
})
export class SchedulerModule {}
