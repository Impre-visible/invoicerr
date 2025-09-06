-- CreateEnum
CREATE TYPE "public"."Currency" AS ENUM ('AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN', 'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BRL', 'BSD', 'BTC', 'BTN', 'BWP', 'BYR', 'BZD', 'CAD', 'CDF', 'CHF', 'CLF', 'CLP', 'CNY', 'COP', 'CRC', 'CUC', 'CUP', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EEK', 'EGP', 'ERN', 'ETB', 'EUR', 'FJD', 'FKP', 'GBP', 'GEL', 'GGP', 'GHS', 'GIP', 'GMD', 'GNF', 'GTQ', 'GYD', 'HKD', 'HNL', 'HRK', 'HTG', 'HUF', 'IDR', 'ILS', 'IMP', 'INR', 'IQD', 'IRR', 'ISK', 'JEP', 'JMD', 'JOD', 'JPY', 'KES', 'KGS', 'KHR', 'KMF', 'KPW', 'KRW', 'KWD', 'KYD', 'KZT', 'LAK', 'LBP', 'LKR', 'LRD', 'LSL', 'LTL', 'LVL', 'LYD', 'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MNT', 'MOP', 'MRO', 'MTL', 'MUR', 'MVR', 'MWK', 'MXN', 'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NPR', 'NZD', 'OMR', 'PAB', 'PEN', 'PGK', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD', 'RUB', 'RWF', 'SAR', 'SBD', 'SCR', 'SDG', 'SEK', 'SGD', 'SHP', 'SLL', 'SOS', 'SRD', 'STD', 'SVC', 'SYP', 'SZL', 'THB', 'TJS', 'TMT', 'TND', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS', 'UAH', 'UGX', 'USD', 'UYU', 'UZS', 'VEF', 'VND', 'VUV', 'WST', 'XAF', 'XAG', 'XAU', 'XCD', 'XDR', 'XOF', 'XPD', 'XPF', 'XPT', 'YER', 'ZAR', 'ZMK', 'ZMW', 'ZWL');

-- CreateEnum
CREATE TYPE "public"."MailTemplateType" AS ENUM ('SIGNATURE_REQUEST', 'VERIFICATION_CODE', 'INVOICE', 'RECEIPT');

-- CreateEnum
CREATE TYPE "public"."QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'SIGNED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('PAID', 'UNPAID', 'OVERDUE', 'SENT');

-- CreateEnum
CREATE TYPE "public"."RecurrenceFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'QUADMONTHLY', 'SEMIANNUALLY', 'ANNUALLY');

-- CreateTable
CREATE TABLE "public"."Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "legalId" TEXT,
    "VAT" TEXT,
    "foundedAt" TIMESTAMP(3),
    "contactFirstname" TEXT NOT NULL,
    "contactLastname" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "address" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "currency" "public"."Currency",
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "currency" "public"."Currency" NOT NULL DEFAULT 'EUR',
    "legalId" TEXT,
    "foundedAt" TIMESTAMP(3) NOT NULL,
    "VAT" TEXT,
    "address" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "quoteStartingNumber" INTEGER NOT NULL DEFAULT 1,
    "quoteNumberFormat" TEXT NOT NULL DEFAULT 'Q-{year}-{number:4}',
    "invoiceStartingNumber" INTEGER NOT NULL DEFAULT 1,
    "invoiceNumberFormat" TEXT NOT NULL DEFAULT 'INV-{year}-{number:4}',
    "receiptStartingNumber" INTEGER NOT NULL DEFAULT 1,
    "receiptNumberFormat" TEXT NOT NULL DEFAULT 'REC-{year}-{number:4}',
    "invoicePDFFormat" TEXT NOT NULL DEFAULT 'facturx',
    "dateFormat" TEXT NOT NULL DEFAULT 'dd/MM/yyyy',
    "pDFConfigId" TEXT NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MailTemplate" (
    "id" TEXT NOT NULL,
    "type" "public"."MailTemplateType" NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "MailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "rawNumber" TEXT,
    "quoteId" TEXT,
    "recurringInvoiceId" TEXT,
    "clientId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "paymentDetails" TEXT,
    "notes" TEXT DEFAULT '',
    "totalHT" DOUBLE PRECISION NOT NULL,
    "totalVAT" DOUBLE PRECISION NOT NULL,
    "totalTTC" DOUBLE PRECISION NOT NULL,
    "currency" "public"."Currency" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "vatRate" DOUBLE PRECISION NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PDFConfig" (
    "id" TEXT NOT NULL,
    "fontFamily" TEXT NOT NULL DEFAULT 'Arial',
    "padding" INTEGER NOT NULL DEFAULT 40,
    "primaryColor" TEXT NOT NULL DEFAULT '#2563eb',
    "secondaryColor" TEXT NOT NULL DEFAULT '#64748b',
    "includeLogo" BOOLEAN NOT NULL DEFAULT false,
    "logoB64" TEXT,
    "invoice" TEXT NOT NULL DEFAULT 'Invoice',
    "quote" TEXT NOT NULL DEFAULT 'Quote',
    "receipt" TEXT NOT NULL DEFAULT 'Receipt',
    "description" TEXT NOT NULL DEFAULT 'Description:',
    "date" TEXT NOT NULL DEFAULT 'Date:',
    "dueDate" TEXT NOT NULL DEFAULT 'Due date:',
    "validUntil" TEXT NOT NULL DEFAULT 'Valid until:',
    "paymentDate" TEXT NOT NULL DEFAULT 'Payment date:',
    "billTo" TEXT NOT NULL DEFAULT 'Bill to:',
    "quoteFor" TEXT NOT NULL DEFAULT 'Quote for:',
    "receivedFrom" TEXT NOT NULL DEFAULT 'Received from:',
    "invoiceRefer" TEXT NOT NULL DEFAULT 'Invoice reference:',
    "quantity" TEXT NOT NULL DEFAULT 'Qty',
    "vatRate" TEXT NOT NULL DEFAULT 'VAT (%)',
    "unitPrice" TEXT NOT NULL DEFAULT 'Unit price',
    "subtotal" TEXT NOT NULL DEFAULT 'Subtotal:',
    "total" TEXT NOT NULL DEFAULT 'Total:',
    "vat" TEXT NOT NULL DEFAULT 'VAT:',
    "grandTotal" TEXT NOT NULL DEFAULT 'Grand total:',
    "totalReceived" TEXT NOT NULL DEFAULT 'Total received:',
    "notes" TEXT NOT NULL DEFAULT 'Notes:',
    "paymentMethod" TEXT NOT NULL DEFAULT 'Payment Method:',
    "paymentDetails" TEXT NOT NULL DEFAULT 'Payment Details:',
    "VATId" TEXT NOT NULL DEFAULT 'VAT',
    "legalId" TEXT NOT NULL DEFAULT 'Legal ID',

    CONSTRAINT "PDFConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReceiptItem" (
    "id" TEXT NOT NULL,
    "invoiceItemId" TEXT NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "receiptId" TEXT NOT NULL,

    CONSTRAINT "ReceiptItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Receipt" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "rawNumber" TEXT,
    "invoiceId" TEXT NOT NULL,
    "totalPaid" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT '',
    "paymentDetails" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Quote" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "rawNumber" TEXT,
    "title" TEXT,
    "clientId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "status" "public"."QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "signedBy" TEXT,
    "totalHT" DOUBLE PRECISION NOT NULL,
    "totalVAT" DOUBLE PRECISION NOT NULL,
    "totalTTC" DOUBLE PRECISION NOT NULL,
    "currency" "public"."Currency" NOT NULL,
    "paymentMethod" TEXT,
    "paymentDetails" TEXT,
    "notes" TEXT DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuoteItem" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "vatRate" DOUBLE PRECISION NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RecurringInvoice" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "paymentDetails" TEXT,
    "notes" TEXT DEFAULT '',
    "totalHT" DOUBLE PRECISION NOT NULL,
    "totalVAT" DOUBLE PRECISION NOT NULL,
    "totalTTC" DOUBLE PRECISION NOT NULL,
    "currency" "public"."Currency" NOT NULL,
    "frequency" "public"."RecurrenceFrequency" NOT NULL,
    "count" INTEGER,
    "until" TIMESTAMP(3),
    "autoSend" BOOLEAN NOT NULL DEFAULT false,
    "nextInvoiceDate" TIMESTAMP(3),
    "lastInvoiceDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RecurringInvoiceItem" (
    "id" TEXT NOT NULL,
    "recurringInvoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "vatRate" DOUBLE PRECISION NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "RecurringInvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Signature" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "otpCode" TEXT,
    "otpUsed" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Signature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CurrencyConversion" (
    "id" TEXT NOT NULL,
    "fromCurrency" "public"."Currency" NOT NULL,
    "toCurrency" "public"."Currency" NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurrencyConversion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_contactEmail_key" ON "public"."Client"("contactEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Company_pDFConfigId_key" ON "public"."Company"("pDFConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "MailTemplate_companyId_type_key" ON "public"."MailTemplate"("companyId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CurrencyConversion_fromCurrency_toCurrency_key" ON "public"."CurrencyConversion"("fromCurrency", "toCurrency");

-- AddForeignKey
ALTER TABLE "public"."Company" ADD CONSTRAINT "Company_pDFConfigId_fkey" FOREIGN KEY ("pDFConfigId") REFERENCES "public"."PDFConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MailTemplate" ADD CONSTRAINT "MailTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "public"."Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_recurringInvoiceId_fkey" FOREIGN KEY ("recurringInvoiceId") REFERENCES "public"."RecurringInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReceiptItem" ADD CONSTRAINT "ReceiptItem_invoiceItemId_fkey" FOREIGN KEY ("invoiceItemId") REFERENCES "public"."InvoiceItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReceiptItem" ADD CONSTRAINT "ReceiptItem_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "public"."Receipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Receipt" ADD CONSTRAINT "Receipt_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quote" ADD CONSTRAINT "Quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quote" ADD CONSTRAINT "Quote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuoteItem" ADD CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "public"."Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecurringInvoice" ADD CONSTRAINT "RecurringInvoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecurringInvoice" ADD CONSTRAINT "RecurringInvoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecurringInvoiceItem" ADD CONSTRAINT "RecurringInvoiceItem_recurringInvoiceId_fkey" FOREIGN KEY ("recurringInvoiceId") REFERENCES "public"."RecurringInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Signature" ADD CONSTRAINT "Signature_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "public"."Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
