-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('not_started', 'ready_to_start', 'in_progress', 'paused', 'finished');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('forest', 'city', 'beach');

-- CreateEnum
CREATE TYPE "ActivityVisibility" AS ENUM ('private', 'public');

-- CreateEnum
CREATE TYPE "ActivityInvitationStatus" AS ENUM ('pending', 'accepted', 'refused');

-- CreateEnum
CREATE TYPE "FriendRequestStatus" AS ENUM ('pending', 'accepted', 'refused');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('formation', 'module', 'lesson');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('invoice', 'prescription');

-- CreateEnum
CREATE TYPE "DogDominance" AS ENUM ('neutral', 'dominant', 'dominated');

-- CreateEnum
CREATE TYPE "DogSex" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('pending', 'completed', 'failed');

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "refresh_token" TEXT,
    "role_id" INTEGER NOT NULL DEFAULT 1,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "age" INTEGER,
    "place" VARCHAR(100),
    "description" VARCHAR(500),
    "on_boarding" BOOLEAN NOT NULL DEFAULT true,
    "expo_push_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "stripe_customer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "breeds" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "breeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "behavior" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "behavior_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dogs" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(200),
    "dominance" "DogDominance",
    "sex" "DogSex" NOT NULL,
    "age" INTEGER NOT NULL,
    "breed_id" INTEGER NOT NULL,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dog_behaviors" (
    "id" SERIAL NOT NULL,
    "dog_id" UUID NOT NULL,
    "behavior_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dog_behaviors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dog_measurements" (
    "id" BIGSERIAL NOT NULL,
    "dog_id" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dog_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "place" VARCHAR(50),
    "visibility" "ActivityVisibility" NOT NULL,
    "type" "ActivityType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "duration" VARCHAR(50),
    "status" "ActivityStatus" NOT NULL DEFAULT 'not_started',
    "participant_limit" INTEGER,
    "latitude" TEXT,
    "longitude" TEXT,
    "department" TEXT,
    "country" TEXT,
    "geohash" TEXT,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "current_state" JSONB DEFAULT '{"is_active": false, "started_by": null, "participants_ready": []}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_invitations" (
    "id" BIGSERIAL NOT NULL,
    "sender_id" UUID NOT NULL,
    "receiver_id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "status" "ActivityInvitationStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activities" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "steps" (
    "id" BIGSERIAL NOT NULL,
    "activity_id" UUID NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_stats" (
    "id" UUID NOT NULL,
    "activity_id" UUID,
    "user_id" UUID NOT NULL,
    "distance_km" DECIMAL(10,3) DEFAULT 0,
    "duration_minutes" INTEGER DEFAULT 0,
    "actual_start_time" TIMESTAMP(3),
    "actual_end_time" TIMESTAMP(3),
    "average_speed_kmh" DECIMAL(5,2),
    "max_speed_kmh" DECIMAL(5,2),
    "elevation_gain_meters" INTEGER DEFAULT 0,
    "elevation_loss_meters" INTEGER DEFAULT 0,
    "steps_count" INTEGER,
    "calories_burned" INTEGER,
    "route_points" JSONB,
    "pause_duration_minutes" INTEGER DEFAULT 0,
    "moving_time_minutes" INTEGER,
    "weather_condition" VARCHAR(50),
    "temperature_celsius" DECIMAL(4,1),
    "is_completed" BOOLEAN DEFAULT false,
    "synced_to_user_stats" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_live_push_tokens" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "push_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_live_push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_participants" (
    "id" BIGSERIAL NOT NULL,
    "conversation_id" BIGINT NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" BIGSERIAL NOT NULL,
    "conversation_id" BIGINT NOT NULL,
    "sender_id" UUID NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "is_read" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friend_requests" (
    "id" BIGSERIAL NOT NULL,
    "sender_id" UUID NOT NULL,
    "recipient_id" UUID NOT NULL,
    "status" "FriendRequestStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "friend_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friendships" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "friend_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'accepted',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_meetings" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "met_user_id" UUID NOT NULL,
    "activity_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vaccinations" (
    "id" BIGSERIAL NOT NULL,
    "dog_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vaccinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" BIGSERIAL NOT NULL,
    "dog_id" UUID NOT NULL,
    "file_name" TEXT,
    "document_type" "DocumentType" NOT NULL,
    "place" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_reminders" (
    "id" BIGSERIAL NOT NULL,
    "dog_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "animator_name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "stripe_item_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "formations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" BIGSERIAL NOT NULL,
    "formation_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration" TEXT,
    "price" DOUBLE PRECISION,
    "stripe_item_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" BIGSERIAL NOT NULL,
    "module_id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_steps" (
    "id" BIGSERIAL NOT NULL,
    "lesson_id" BIGINT NOT NULL,
    "content" TEXT,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_materials" (
    "id" BIGSERIAL NOT NULL,
    "module_id" BIGINT,
    "material_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "module_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opinions" (
    "id" BIGSERIAL NOT NULL,
    "formation_id" INTEGER NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opinions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_progress" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "content_type" "ContentType" NOT NULL,
    "content_id" BIGINT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_purchases" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "product_id" TEXT NOT NULL,
    "price_id" TEXT,
    "payment_intent_id" TEXT,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formation_favorites" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "formation_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "formation_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_stats" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "total_distance_km" DECIMAL(12,3) DEFAULT 0,
    "total_activities" INTEGER DEFAULT 0,
    "total_duration_minutes" INTEGER DEFAULT 0,
    "current_streak" INTEGER DEFAULT 0,
    "longest_streak" INTEGER DEFAULT 0,
    "monthly_distance_km" DECIMAL(12,3) DEFAULT 0,
    "monthly_activities" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_stats_history" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "snapshot_date" TIMESTAMP(3) NOT NULL,
    "total_distance_km" DECIMAL(12,3),
    "total_activities" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_stats_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badge_categories" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name_key" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(50),
    "color" VARCHAR(7),
    "display_order" INTEGER DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "badge_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" UUID NOT NULL,
    "category_id" UUID,
    "code" VARCHAR(50) NOT NULL,
    "name_key" VARCHAR(100) NOT NULL,
    "description_key" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(50),
    "points" INTEGER NOT NULL,
    "requirement_type" VARCHAR(50),
    "requirement_value" DECIMAL,
    "requirement_unit" VARCHAR(20),
    "is_secret" BOOLEAN NOT NULL DEFAULT false,
    "rarity" VARCHAR(20),
    "display_order" INTEGER DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "badge_id" UUID NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_user_id_key" ON "customers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "breeds_name_key" ON "breeds"("name");

-- CreateIndex
CREATE UNIQUE INDEX "behavior_name_key" ON "behavior"("name");

-- CreateIndex
CREATE INDEX "dogs_owner_id_idx" ON "dogs"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "dog_behaviors_dog_id_behavior_id_key" ON "dog_behaviors"("dog_id", "behavior_id");

-- CreateIndex
CREATE INDEX "activities_creator_id_idx" ON "activities"("creator_id");

-- CreateIndex
CREATE INDEX "activities_geohash_idx" ON "activities"("geohash");

-- CreateIndex
CREATE UNIQUE INDEX "user_activities_user_id_activity_id_key" ON "user_activities"("user_id", "activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_stats_activity_id_user_id_key" ON "activity_stats"("activity_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_live_push_tokens_user_id_activity_id_key" ON "activity_live_push_tokens"("user_id", "activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participants_conversation_id_user_id_key" ON "conversation_participants"("conversation_id", "user_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "friendships_user_id_friend_id_key" ON "friendships"("user_id", "friend_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_meetings_user_id_met_user_id_key" ON "user_meetings"("user_id", "met_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "formation_favorites_user_id_formation_id_key" ON "formation_favorites"("user_id", "formation_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_stats_user_id_key" ON "user_stats"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "badge_categories_code_key" ON "badge_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "badges_code_key" ON "badges"("code");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_user_id_badge_id_key" ON "user_badges"("user_id", "badge_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dogs" ADD CONSTRAINT "dogs_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dogs" ADD CONSTRAINT "dogs_breed_id_fkey" FOREIGN KEY ("breed_id") REFERENCES "breeds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dog_behaviors" ADD CONSTRAINT "dog_behaviors_dog_id_fkey" FOREIGN KEY ("dog_id") REFERENCES "dogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dog_behaviors" ADD CONSTRAINT "dog_behaviors_behavior_id_fkey" FOREIGN KEY ("behavior_id") REFERENCES "behavior"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dog_measurements" ADD CONSTRAINT "dog_measurements_dog_id_fkey" FOREIGN KEY ("dog_id") REFERENCES "dogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_invitations" ADD CONSTRAINT "activity_invitations_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_invitations" ADD CONSTRAINT "activity_invitations_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_invitations" ADD CONSTRAINT "activity_invitations_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "steps" ADD CONSTRAINT "steps_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_stats" ADD CONSTRAINT "activity_stats_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_stats" ADD CONSTRAINT "activity_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_live_push_tokens" ADD CONSTRAINT "activity_live_push_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_meetings" ADD CONSTRAINT "user_meetings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_meetings" ADD CONSTRAINT "user_meetings_met_user_id_fkey" FOREIGN KEY ("met_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccinations" ADD CONSTRAINT "vaccinations_dog_id_fkey" FOREIGN KEY ("dog_id") REFERENCES "dogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_dog_id_fkey" FOREIGN KEY ("dog_id") REFERENCES "dogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_reminders" ADD CONSTRAINT "health_reminders_dog_id_fkey" FOREIGN KEY ("dog_id") REFERENCES "dogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_formation_id_fkey" FOREIGN KEY ("formation_id") REFERENCES "formations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_steps" ADD CONSTRAINT "lesson_steps_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_materials" ADD CONSTRAINT "module_materials_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_materials" ADD CONSTRAINT "module_materials_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opinions" ADD CONSTRAINT "opinions_formation_id_fkey" FOREIGN KEY ("formation_id") REFERENCES "formations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opinions" ADD CONSTRAINT "opinions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_purchases" ADD CONSTRAINT "user_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formation_favorites" ADD CONSTRAINT "formation_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formation_favorites" ADD CONSTRAINT "formation_favorites_formation_id_fkey" FOREIGN KEY ("formation_id") REFERENCES "formations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_stats_history" ADD CONSTRAINT "user_stats_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "badge_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
