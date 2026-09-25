-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "logo" BYTEA,
ADD COLUMN     "logo_type" TEXT,
ADD COLUMN     "logo_updated_at" TIMESTAMPTZ;
