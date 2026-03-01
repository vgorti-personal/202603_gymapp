ALTER TABLE "users" ALTER COLUMN "default_city" SET DEFAULT 'Atlanta, GA, USA';
UPDATE "users" SET "default_city" = 'Atlanta, GA, USA' WHERE "default_city" = 'New York';
