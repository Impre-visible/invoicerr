/*
  Warnings:

  - The values [PDF_FORMAT,PAYMENT,OIDC] on the enum `PluginType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."PluginType_new" AS ENUM ('SIGNING', 'STORAGE');
ALTER TABLE "public"."Plugin" ALTER COLUMN "type" TYPE "public"."PluginType_new" USING ("type"::text::"public"."PluginType_new");
ALTER TYPE "public"."PluginType" RENAME TO "PluginType_old";
ALTER TYPE "public"."PluginType_new" RENAME TO "PluginType";
DROP TYPE "public"."PluginType_old";
COMMIT;
