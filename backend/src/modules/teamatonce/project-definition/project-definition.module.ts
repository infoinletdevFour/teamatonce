import { Module, forwardRef } from '@nestjs/common';
import { ProjectDefinitionService } from './project-definition.service';
import { ProjectDefinitionController } from './project-definition.controller';
import { NotificationsModule } from '../../notifications/notifications.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [forwardRef(() => NotificationsModule), AuthModule],
  controllers: [ProjectDefinitionController],
  providers: [ProjectDefinitionService],
  exports: [ProjectDefinitionService],
})
export class ProjectDefinitionModule {}
