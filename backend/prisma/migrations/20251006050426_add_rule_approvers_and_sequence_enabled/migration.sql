-- AlterTable
ALTER TABLE "ApprovalRule" ADD COLUMN     "approversSequenceEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "RuleApprover" (
    "id" TEXT NOT NULL,
    "approvalRuleId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuleApprover_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RuleApprover_approvalRuleId_idx" ON "RuleApprover"("approvalRuleId");

-- CreateIndex
CREATE INDEX "RuleApprover_approverId_idx" ON "RuleApprover"("approverId");

-- CreateIndex
CREATE UNIQUE INDEX "RuleApprover_approvalRuleId_approverId_key" ON "RuleApprover"("approvalRuleId", "approverId");

-- AddForeignKey
ALTER TABLE "RuleApprover" ADD CONSTRAINT "RuleApprover_approvalRuleId_fkey" FOREIGN KEY ("approvalRuleId") REFERENCES "ApprovalRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleApprover" ADD CONSTRAINT "RuleApprover_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
