/*
  Warnings:

  - You are about to drop the column `webhookSecretHash` on the `Plugin` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Plugin" DROP COLUMN "webhookSecretHash",
ADD COLUMN     "webhookSecret" TEXT;
