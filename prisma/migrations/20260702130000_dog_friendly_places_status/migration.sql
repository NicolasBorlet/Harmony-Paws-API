-- CreateEnum
CREATE TYPE "DogFriendlyPlaceStatus" AS ENUM ('need_review', 'active');

-- AlterTable
ALTER TABLE "dog_friendly_places"
ADD COLUMN "status" "DogFriendlyPlaceStatus" NOT NULL DEFAULT 'active',
ADD COLUMN "created_by_id" UUID;

-- CreateIndex
CREATE INDEX "dog_friendly_places_status_idx" ON "dog_friendly_places"("status");

-- AddForeignKey
ALTER TABLE "dog_friendly_places"
ADD CONSTRAINT "dog_friendly_places_created_by_id_fkey"
FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
