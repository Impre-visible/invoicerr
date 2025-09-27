/*
  Warnings:

  - Changed the type of `fromCurrency` on the `CurrencyConversion` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `toCurrency` on the `CurrencyConversion` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."Client" ALTER COLUMN "contactFirstname" DROP NOT NULL,
ALTER COLUMN "contactLastname" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."CurrencyConversion" DROP COLUMN "fromCurrency",
ADD COLUMN     "fromCurrency" TEXT NOT NULL,
DROP COLUMN "toCurrency",
ADD COLUMN     "toCurrency" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CurrencyConversion_fromCurrency_toCurrency_key" ON "public"."CurrencyConversion"("fromCurrency", "toCurrency");
