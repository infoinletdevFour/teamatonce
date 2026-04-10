import { Module } from '@nestjs/common';
import { EdgeFunctionsController } from './edge-functions.controller';
import { EdgeFunctionsService } from './edge-functions.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [EdgeFunctionsController],
  providers: [EdgeFunctionsService],
  exports: [EdgeFunctionsService],
})
export class EdgeFunctionsModule {}