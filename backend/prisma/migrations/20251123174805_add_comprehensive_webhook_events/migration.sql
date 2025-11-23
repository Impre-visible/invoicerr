-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."WebhookEvent" ADD VALUE 'QUOTE_UPDATED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'QUOTE_DELETED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'QUOTE_SENT';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'QUOTE_SIGNED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'QUOTE_EXPIRED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'QUOTE_REJECTED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'INVOICE_UPDATED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'INVOICE_DELETED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'INVOICE_SENT';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'INVOICE_PAID';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'INVOICE_OVERDUE';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'RECEIPT_CREATED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'RECEIPT_UPDATED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'RECEIPT_DELETED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'RECEIPT_SENT';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'PAYMENT_METHOD_CREATED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'PAYMENT_METHOD_UPDATED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'PAYMENT_METHOD_DELETED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'SIGNATURE_CREATED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'SIGNATURE_EXPIRED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'SIGNATURE_OTP_GENERATED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'CLIENT_CREATED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'CLIENT_UPDATED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'CLIENT_DELETED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'COMPANY_CREATED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'COMPANY_UPDATED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'RECURRING_INVOICE_CREATED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'RECURRING_INVOICE_UPDATED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'RECURRING_INVOICE_DELETED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'RECURRING_INVOICE_GENERATED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'PLUGIN_ACTIVATED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'PLUGIN_DEACTIVATED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'PLUGIN_CONFIGURED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'USER_CREATED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'USER_UPDATED';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'EMAIL_SENT';
ALTER TYPE "public"."WebhookEvent" ADD VALUE 'APP_RESET';
