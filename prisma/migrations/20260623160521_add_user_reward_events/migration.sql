-- CreateEnum
CREATE TYPE "RewardSource" AS ENUM ('badge', 'activity');

-- AlterTable
ALTER TABLE "user_stats" ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "total_experience" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_points" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "user_reward_events" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "source" "RewardSource" NOT NULL,
    "source_id" VARCHAR(100) NOT NULL,
    "points" INTEGER NOT NULL,
    "experience" INTEGER NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_reward_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_reward_events_user_id_created_at_idx" ON "user_reward_events"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_reward_events_user_id_source_source_id_key" ON "user_reward_events"("user_id", "source", "source_id");

-- AddForeignKey
ALTER TABLE "user_reward_events" ADD CONSTRAINT "user_reward_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
