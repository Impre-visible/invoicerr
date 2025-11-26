-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."WebhookType" ADD VALUE 'SLACK';
ALTER TYPE "public"."WebhookType" ADD VALUE 'TEAMS';
ALTER TYPE "public"."WebhookType" ADD VALUE 'ZAPIER';
ALTER TYPE "public"."WebhookType" ADD VALUE 'ROCKETCHAT';
