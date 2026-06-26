-- CreateTable
CREATE TABLE "activity_dogs" (
    "id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "dog_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_dogs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_dogs_activity_id_idx" ON "activity_dogs"("activity_id");

-- CreateIndex
CREATE INDEX "activity_dogs_user_id_idx" ON "activity_dogs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_dogs_activity_id_dog_id_key" ON "activity_dogs"("activity_id", "dog_id");

-- AddForeignKey
ALTER TABLE "activity_dogs" ADD CONSTRAINT "activity_dogs_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_dogs" ADD CONSTRAINT "activity_dogs_dog_id_fkey" FOREIGN KEY ("dog_id") REFERENCES "dogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_dogs" ADD CONSTRAINT "activity_dogs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
