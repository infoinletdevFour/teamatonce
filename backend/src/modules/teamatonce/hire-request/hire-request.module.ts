import { Module, forwardRef } from '@nestjs/common';
import { HireRequestController } from './hire-request.controller';
import { HireRequestService } from './hire-request.service';
import { NotificationsModule } from '../../notifications/notifications.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    forwardRef(() => NotificationsModule),
    AuthModule,
  ],
  controllers: [HireRequestController],
  providers: [HireRequestService],
  exports: [HireRequestService],
})
export class HireRequestModule {}
