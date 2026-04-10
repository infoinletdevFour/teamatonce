import { Module, forwardRef } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { WebSocketModule } from '../../common/gateways/websocket.module';
import { TeamAtOnceWebSocketModule } from '../../websocket/websocket.module';
import { FirebaseService } from './firebase.service';
import { DeviceTokenService } from './device-token.service';
import { DeviceTokenController } from './device-token.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    forwardRef(() => WebSocketModule),
    forwardRef(() => TeamAtOnceWebSocketModule),
    AuthModule,
  ],
  controllers: [NotificationsController, DeviceTokenController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    FirebaseService,
    DeviceTokenService,
  ],
  exports: [
    NotificationsService,
    NotificationsGateway,
    FirebaseService,
    DeviceTokenService,
  ],
})
export class NotificationsModule {}