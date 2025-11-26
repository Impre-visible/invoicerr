-- CreateEnum
CREATE TYPE "public"."WebhookEvent" AS ENUM ('QUOTE_CREATED', 'INVOICE_CREATED', 'PAYMENT_RECEIVED', 'SIGNATURE_COMPLETED');

-- CreateEnum
CREATE TYPE "public"."WebhookType" AS ENUM ('GENERIC', 'DISCORD', 'MATTERMOST');

-- CreateTable
CREATE TABLE "public"."Webhook" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT,
    "type" "public"."WebhookType" NOT NULL DEFAULT 'GENERIC',
    "events" "public"."WebhookEvent"[],

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);
