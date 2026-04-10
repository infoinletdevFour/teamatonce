import { Module, forwardRef } from '@nestjs/common';
import { ContractController } from './contract.controller';
import { ContractService } from './contract.service';
import { SupportService } from './support.service';
import { NotificationsModule } from '../../notifications/notifications.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [forwardRef(() => NotificationsModule), AuthModule],
})
export class ContractModule {}
