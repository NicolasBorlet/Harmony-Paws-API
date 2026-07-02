-- CreateEnum
CREATE TYPE "DogFriendlyCategory" AS ENUM (
    'dog_park',
    'beach',
    'drinking_water',
    'dog_agility',
    'nature_reserve',
    'animal_training',
    'animal_shelter',
    'guest_house',
    'other'
);

-- CreateEnum
CREATE TYPE "DogPolicy" AS ENUM ('yes', 'leashed', 'unleashed', 'designated');

-- CreateTable
CREATE TABLE "dog_friendly_places" (
    "id" UUID NOT NULL,
    "osm_type" VARCHAR(10) NOT NULL,
    "osm_id" BIGINT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "geohash" VARCHAR(12) NOT NULL,
    "category" "DogFriendlyCategory" NOT NULL,
    "name" TEXT,
    "dog_policy" "DogPolicy",
    "wheelchair" VARCHAR(20),
    "access" VARCHAR(20),
    "city" VARCHAR(100),
    "postcode" VARCHAR(10),
    "street" VARCHAR(200),
    "phone" VARCHAR(30),
    "email" VARCHAR(200),
    "website" VARCHAR(500),
    "opening_hours" VARCHAR(200),
    "description" TEXT,
    "tags" JSONB NOT NULL DEFAULT '{}',
    "source" VARCHAR(200),
    "survey_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dog_friendly_places_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dog_friendly_places_osm_type_osm_id_key" ON "dog_friendly_places"("osm_type", "osm_id");

-- CreateIndex
CREATE INDEX "dog_friendly_places_geohash_idx" ON "dog_friendly_places"("geohash");

-- CreateIndex
CREATE INDEX "dog_friendly_places_category_idx" ON "dog_friendly_places"("category");

-- CreateIndex
CREATE INDEX "dog_friendly_places_latitude_longitude_idx" ON "dog_friendly_places"("latitude", "longitude");
