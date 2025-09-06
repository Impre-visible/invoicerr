import { MailService } from "@/mail/mail.service";
import { InvoicesController } from "@/modules/invoices/invoices.controller";
import { InvoicesService } from "@/modules/invoices/invoices.service";
import { PluginsService } from "@/modules/plugins/plugins.service";
import { Module } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Module({
  controllers: [InvoicesController],
  providers: [InvoicesService, MailService, JwtService, PluginsService]
})
export class InvoicesModule { }
