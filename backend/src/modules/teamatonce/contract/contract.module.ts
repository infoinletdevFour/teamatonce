import { Module, forwardRef } from '@nestjs/common';
import { ContractController } from './contract.controller';
import { PaymentWebhookController } from './webhook.controller';
import { ContractService } from './contract.service';
import { PaymentService } from './payment.service';
import { SupportService } from './support.service';
import { NotificationsModule } from '../../notifications/notifications.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [forwardRef(() => NotificationsModule), AuthModule],
  controllers: [ContractController, PaymentWebhookController],
  providers: [ContractService, PaymentService, SupportService],
  exports: [ContractService, PaymentService, SupportService],
})
export class ContractModule {}
