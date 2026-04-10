import { Module, forwardRef } from '@nestjs/common';
import { TeamController } from './team.controller';
import { TeamMembersService } from './team-members.service';
import { TeamAssignmentService } from './team-assignment.service';
import { MemberStatusService } from './member-status.service';
import { NotificationsModule } from '../../notifications/notifications.module';
import { AppGateway } from '../../../common/gateways/app.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => NotificationsModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION', '7d'),
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
  ],
  controllers: [TeamController],
  providers: [
    TeamMembersService,
    TeamAssignmentService,
    MemberStatusService,
    AppGateway,
  ],
  exports: [
    TeamMembersService,
    TeamAssignmentService,
    MemberStatusService,
  ],
})
export class TeamModule {}
