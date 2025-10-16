-- AlterTable
ALTER TABLE "public"."Client" ADD COLUMN     "salutation" TEXT NOT NULL DEFAULT 'Mr',
ADD COLUMN     "sex" TEXT NOT NULL DEFAULT 'other',
ADD COLUMN     "title" TEXT NOT NULL DEFAULT 'Doctor';
