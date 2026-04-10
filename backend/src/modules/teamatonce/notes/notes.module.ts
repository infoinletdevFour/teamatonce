import { Module, forwardRef } from '@nestjs/common';
import { NotificationsModule } from '../../notifications/notifications.module';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [forwardRef(() => NotificationsModule), AuthModule],
  controllers: [NotesController],
  providers: [NotesService],
  exports: [NotesService],
})
export class NotesModule {}
