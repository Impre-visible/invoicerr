import { MailService } from "@/mail/mail.service";
import { InvoicesController } from "@/models/invoices/invoices.controller";
import { InvoicesService } from "@/models/invoices/invoices.service";
import { PluginsService } from "@/models/plugins/plugins.service";
import { Module } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Module({
  controllers: [InvoicesController],
  providers: [InvoicesService, MailService, JwtService, PluginsService]
})
export class InvoicesModule { }
