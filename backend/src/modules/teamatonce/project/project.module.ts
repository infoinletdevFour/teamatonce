import { Module, forwardRef } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { ProposalService } from './proposal.service';
import { ProposalController } from './proposal.controller';
import { FileController } from './file.controller';
import { ProjectMemberService } from './project-member.service';
import { ProjectAccessService } from './project-access.service';
import { MilestonePlanService } from './milestone-plan.service';
import { MilestonePlanController } from './milestone-plan.controller';
import { MilestoneAdjustmentService } from './milestone-adjustment.service';
import { MilestoneAdjustmentController } from './milestone-adjustment.controller';
import { NotificationsModule } from '../../notifications/notifications.module';
import { TeamAtOnceWebSocketModule } from '../../../websocket/websocket.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    forwardRef(() => NotificationsModule),
    forwardRef(() => TeamAtOnceWebSocketModule),
    AuthModule,
  ],
  controllers: [
    ProjectController,
    ProposalController,
    FileController,
    MilestonePlanController,
    MilestoneAdjustmentController,
  ],
  providers: [
    ProjectService,
    ProposalService,
    ProjectMemberService,
    ProjectAccessService,
    MilestonePlanService,
    MilestoneAdjustmentService,
  ],
  exports: [
    ProjectService,
    ProposalService,
    ProjectMemberService,
    ProjectAccessService,
    MilestonePlanService,
    MilestoneAdjustmentService,
  ],
})
export class ProjectModule {}
