-- CreateTable
CREATE TABLE "dog_stats" (
    "id" UUID NOT NULL,
    "dog_id" UUID NOT NULL,
    "total_distance_km" DECIMAL(12,3) DEFAULT 0,
    "total_activities" INTEGER DEFAULT 0,
    "total_duration_minutes" INTEGER DEFAULT 0,
    "monthly_distance_km" DECIMAL(12,3) DEFAULT 0,
    "monthly_activities" INTEGER DEFAULT 0,
    "last_activity_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dog_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_dog_stats" (
    "id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "dog_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "distance_km" DECIMAL(12,3),
    "duration_minutes" INTEGER,
    "activity_stats_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_dog_stats_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "activity_stats" ADD COLUMN "synced_to_dog_stats" BOOLEAN DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "dog_stats_dog_id_key" ON "dog_stats"("dog_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_dog_stats_activity_id_dog_id_key" ON "activity_dog_stats"("activity_id", "dog_id");

-- CreateIndex
CREATE INDEX "activity_dog_stats_dog_id_idx" ON "activity_dog_stats"("dog_id");

-- CreateIndex
CREATE INDEX "activity_dog_stats_user_id_idx" ON "activity_dog_stats"("user_id");

-- AddForeignKey
ALTER TABLE "dog_stats" ADD CONSTRAINT "dog_stats_dog_id_fkey" FOREIGN KEY ("dog_id") REFERENCES "dogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_dog_stats" ADD CONSTRAINT "activity_dog_stats_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_dog_stats" ADD CONSTRAINT "activity_dog_stats_dog_id_fkey" FOREIGN KEY ("dog_id") REFERENCES "dogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_dog_stats" ADD CONSTRAINT "activity_dog_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_dog_stats" ADD CONSTRAINT "activity_dog_stats_activity_stats_id_fkey" FOREIGN KEY ("activity_stats_id") REFERENCES "activity_stats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
