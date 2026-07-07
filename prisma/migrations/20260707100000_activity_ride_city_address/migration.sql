-- AlterTable
ALTER TABLE "activities" ADD COLUMN "city" VARCHAR(100),
ADD COLUMN "address" VARCHAR(200);

-- AlterTable
ALTER TABLE "rides" ADD COLUMN "city" VARCHAR(100),
ADD COLUMN "address" VARCHAR(200);
