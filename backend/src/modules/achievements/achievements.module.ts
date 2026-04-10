import { Module } from '@nestjs/common';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';
import { ProgressModule } from '../progress/progress.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ProgressModule, AuthModule],
  controllers: [AchievementsController],
  providers: [AchievementsService],
  exports: [AchievementsService],
})
export class AchievementsModule {}