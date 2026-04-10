import { Module, forwardRef } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminBootstrapService } from './admin-bootstrap.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuthModule, forwardRef(() => NotificationsModule)],
  controllers: [AdminController],
  providers: [AdminService, AdminBootstrapService],
  exports: [AdminService],
})
export class AdminModule {}
