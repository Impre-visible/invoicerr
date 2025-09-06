import { MailService } from "@/mail/mail.service";
import { DangerController } from "@/models/danger/danger.controller";
import { DangerService } from "@/models/danger/danger.service";
import { Module } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Module({
  controllers: [DangerController],
  providers: [DangerService, MailService, JwtService]
})
export class DangerModule { }
