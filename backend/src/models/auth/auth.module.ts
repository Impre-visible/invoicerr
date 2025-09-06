import { AuthController } from '@/models/auth/auth.controller';
import { AuthService } from '@/models/auth/auth.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
