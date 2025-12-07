-- CreateTable
CREATE TABLE "invitation_code" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "usedById" TEXT,

    CONSTRAINT "invitation_code_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invitation_code_code_key" ON "invitation_code"("code");

-- CreateIndex
CREATE UNIQUE INDEX "invitation_code_usedById_key" ON "invitation_code"("usedById");

-- CreateIndex
CREATE INDEX "invitation_code_code_idx" ON "invitation_code"("code");

-- CreateIndex
CREATE INDEX "invitation_code_createdById_idx" ON "invitation_code"("createdById");

-- AddForeignKey
ALTER TABLE "invitation_code" ADD CONSTRAINT "invitation_code_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation_code" ADD CONSTRAINT "invitation_code_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
