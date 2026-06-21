-- CreateTable
CREATE TABLE "user_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "push_notifications" BOOLEAN NOT NULL DEFAULT true,
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "ride_notifications" BOOLEAN NOT NULL DEFAULT true,
    "message_notifications" BOOLEAN NOT NULL DEFAULT true,
    "public_profile" BOOLEAN NOT NULL DEFAULT true,
    "share_location" BOOLEAN NOT NULL DEFAULT true,
    "analytics" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_user_id_key" ON "user_preferences"("user_id");

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill existing users with default preferences
INSERT INTO "user_preferences" ("id", "user_id", "updated_at")
SELECT gen_random_uuid(), "id", CURRENT_TIMESTAMP
FROM "users"
WHERE "id" NOT IN (SELECT "user_id" FROM "user_preferences");
