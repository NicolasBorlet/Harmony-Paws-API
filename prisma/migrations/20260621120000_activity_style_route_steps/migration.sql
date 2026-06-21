-- CreateEnum
CREATE TYPE "ActivityStyle" AS ENUM ('casual', 'hike');

-- AlterTable
ALTER TABLE "activities" ADD COLUMN "style" "ActivityStyle" NOT NULL DEFAULT 'casual';

-- AlterTable
ALTER TABLE "steps" ALTER COLUMN "latitude" DROP NOT NULL;
ALTER TABLE "steps" ALTER COLUMN "longitude" DROP NOT NULL;
ALTER TABLE "steps" ALTER COLUMN "timestamp" DROP NOT NULL;
ALTER TABLE "steps" ADD COLUMN "place" VARCHAR(100);
ALTER TABLE "steps" ADD COLUMN "estimated_hour" TIMESTAMP(3);
ALTER TABLE "steps" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "steps_activity_id_sort_order_idx" ON "steps"("activity_id", "sort_order");
