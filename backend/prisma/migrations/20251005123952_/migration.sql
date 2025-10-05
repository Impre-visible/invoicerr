-- CreateEnum
CREATE TYPE "public"."ClientType" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- CreateEnum
CREATE TYPE "public"."ItemType" AS ENUM ('HOUR', 'DAY', 'DEPOSIT', 'SERVICE', 'PRODUCT');

-- CreateEnum
CREATE TYPE "public"."PaymentMethodType" AS ENUM ('BANK_TRANSFER', 'PAYPAL', 'CASH', 'CHECK', 'OTHER');

-- AlterTable
ALTER TABLE "public"."Client" ADD COLUMN     "type" "public"."ClientType" NOT NULL DEFAULT 'COMPANY',
ALTER COLUMN "contactEmail" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Company" ADD COLUMN     "exemptVat" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Invoice" ADD COLUMN     "paymentMethodId" TEXT;

-- AlterTable
ALTER TABLE "public"."InvoiceItem" ADD COLUMN     "type" "public"."ItemType" NOT NULL DEFAULT 'SERVICE';

-- AlterTable
ALTER TABLE "public"."PDFConfig" ADD COLUMN     "day" TEXT NOT NULL DEFAULT 'Day',
ADD COLUMN     "deposit" TEXT NOT NULL DEFAULT 'Deposit',
ADD COLUMN     "hour" TEXT NOT NULL DEFAULT 'Hour',
ADD COLUMN     "paymentMethodBankTransfer" TEXT NOT NULL DEFAULT 'Bank transfer',
ADD COLUMN     "paymentMethodCash" TEXT NOT NULL DEFAULT 'Cash',
ADD COLUMN     "paymentMethodCheck" TEXT NOT NULL DEFAULT 'Check',
ADD COLUMN     "paymentMethodOther" TEXT NOT NULL DEFAULT 'Other',
ADD COLUMN     "paymentMethodPayPal" TEXT NOT NULL DEFAULT 'PayPal',
ADD COLUMN     "product" TEXT NOT NULL DEFAULT 'Product',
ADD COLUMN     "service" TEXT NOT NULL DEFAULT 'Service',
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'Type';

-- AlterTable
ALTER TABLE "public"."Quote" ADD COLUMN     "paymentMethodId" TEXT;

-- AlterTable
ALTER TABLE "public"."QuoteItem" ADD COLUMN     "type" "public"."ItemType" NOT NULL DEFAULT 'SERVICE';

-- AlterTable
ALTER TABLE "public"."Receipt" ADD COLUMN     "paymentMethodId" TEXT;

-- AlterTable
ALTER TABLE "public"."RecurringInvoice" ADD COLUMN     "paymentMethodId" TEXT;

-- AlterTable
ALTER TABLE "public"."RecurringInvoiceItem" ADD COLUMN     "type" "public"."ItemType" NOT NULL DEFAULT 'SERVICE';

-- CreateTable
CREATE TABLE "public"."PaymentMethod" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "details" TEXT,
    "type" "public"."PaymentMethodType" NOT NULL DEFAULT 'BANK_TRANSFER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."PaymentMethod" ADD CONSTRAINT "PaymentMethod_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
