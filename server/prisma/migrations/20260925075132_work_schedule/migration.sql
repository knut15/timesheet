-- CreateEnum
CREATE TYPE "ScheduleExceptionKind" AS ENUM ('off', 'work');

-- AlterTable
ALTER TABLE "memberships" ADD COLUMN     "schedule_days" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "schedule_end" TEXT,
ADD COLUMN     "schedule_start" TEXT;

-- CreateTable
CREATE TABLE "schedule_exceptions" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "kind" "ScheduleExceptionKind" NOT NULL,
    "start" TEXT,
    "end" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schedule_exceptions_user_id_date_key" ON "schedule_exceptions"("user_id", "date");

-- AddForeignKey
ALTER TABLE "schedule_exceptions" ADD CONSTRAINT "schedule_exceptions_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_exceptions" ADD CONSTRAINT "schedule_exceptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
