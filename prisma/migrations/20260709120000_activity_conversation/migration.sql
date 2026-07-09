-- AlterTable
ALTER TABLE "conversations" ADD COLUMN "activity_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "conversations_activity_id_key" ON "conversations"("activity_id");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
