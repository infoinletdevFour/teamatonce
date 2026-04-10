import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UsersController } from './users.controller';
import { UserController } from './user.controller';
import { UsersService } from './users.service';
import { UserLearningService } from './user-learning.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MulterModule.register({
      dest: './uploads', // Temporary destination, files will be uploaded to storage service
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
      },
    }),
  ],
  controllers: [UsersController, UserController],
  providers: [UsersService, UserLearningService],
  exports: [UsersService, UserLearningService],
})
export class UsersModule {}