-- CreateTable
CREATE TABLE "rides" (
    "id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "place" VARCHAR(50),
    "visibility" "ActivityVisibility" NOT NULL,
    "type" "ActivityType" NOT NULL,
    "style" "ActivityStyle" NOT NULL DEFAULT 'casual',
    "date" TIMESTAMP(3),
    "duration" VARCHAR(50),
    "participant_limit" INTEGER,
    "latitude" TEXT,
    "longitude" TEXT,
    "department" TEXT,
    "country" TEXT,
    "geohash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ride_steps" (
    "id" BIGSERIAL NOT NULL,
    "ride_id" UUID NOT NULL,
    "place" VARCHAR(100),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "estimated_hour" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ride_steps_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "activities" ADD COLUMN "source_ride_id" UUID;

-- CreateIndex
CREATE INDEX "rides_creator_id_idx" ON "rides"("creator_id");

-- CreateIndex
CREATE INDEX "rides_geohash_idx" ON "rides"("geohash");

-- CreateIndex
CREATE INDEX "ride_steps_ride_id_sort_order_idx" ON "ride_steps"("ride_id", "sort_order");

-- CreateIndex
CREATE INDEX "activities_source_ride_id_idx" ON "activities"("source_ride_id");

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_source_ride_id_fkey" FOREIGN KEY ("source_ride_id") REFERENCES "rides"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rides" ADD CONSTRAINT "rides_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ride_steps" ADD CONSTRAINT "ride_steps_ride_id_fkey" FOREIGN KEY ("ride_id") REFERENCES "rides"("id") ON DELETE CASCADE ON UPDATE CASCADE;
