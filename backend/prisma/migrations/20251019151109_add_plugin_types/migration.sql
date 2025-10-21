-- CreateEnum
CREATE TYPE "public"."PluginType" AS ENUM ('SIGNING', 'PDF_FORMAT', 'PAYMENT', 'OIDC');

-- CreateTable
CREATE TABLE "public"."Plugin" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."PluginType" NOT NULL,
    "config" JSONB DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plugin_pkey" PRIMARY KEY ("id")
);
