-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('pending', 'approved', 'rejected', 'canceled');

-- CreateEnum
CREATE TYPE "CorrectionAction" AS ENUM ('edit', 'add', 'delete');

-- CreateEnum
CREATE TYPE "SubstitutionStatus" AS ENUM ('requested', 'accepted', 'declined', 'approved', 'rejected', 'canceled');

-- CreateTable
CREATE TABLE "shift_corrections" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "shift_id" UUID,
    "action" "CorrectionAction" NOT NULL,
    "start" TIMESTAMPTZ,
    "end" TIMESTAMPTZ,
    "reason" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "review_note" TEXT,
    "reviewed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shift_corrections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaves" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "paid" BOOLEAN NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "created_by" UUID NOT NULL,
    "review_note" TEXT,
    "reviewed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leaves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "substitutions" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "requester_id" UUID NOT NULL,
    "substitute_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "SubstitutionStatus" NOT NULL DEFAULT 'requested',
    "review_note" TEXT,
    "responded_at" TIMESTAMPTZ,
    "reviewed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "substitutions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shift_corrections_store_id_status_idx" ON "shift_corrections"("store_id", "status");

-- CreateIndex
CREATE INDEX "shift_corrections_user_id_idx" ON "shift_corrections"("user_id");

-- CreateIndex
CREATE INDEX "leaves_store_id_status_idx" ON "leaves"("store_id", "status");

-- CreateIndex
CREATE INDEX "leaves_user_id_start_date_idx" ON "leaves"("user_id", "start_date");

-- CreateIndex
CREATE INDEX "substitutions_store_id_status_idx" ON "substitutions"("store_id", "status");

-- CreateIndex
CREATE INDEX "substitutions_requester_id_date_idx" ON "substitutions"("requester_id", "date");

-- AddForeignKey
ALTER TABLE "shift_corrections" ADD CONSTRAINT "shift_corrections_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_corrections" ADD CONSTRAINT "shift_corrections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_corrections" ADD CONSTRAINT "shift_corrections_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "substitutions" ADD CONSTRAINT "substitutions_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "substitutions" ADD CONSTRAINT "substitutions_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "substitutions" ADD CONSTRAINT "substitutions_substitute_id_fkey" FOREIGN KEY ("substitute_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 대기 중인 수정 요청은 기록당 하나 (docs/prd/08 C-4). Prisma 스키마로 표현할 수 없어 직접 넣는다.
CREATE UNIQUE INDEX "shift_corrections_one_pending_per_shift" ON "shift_corrections"("shift_id") WHERE "status" = 'pending' AND "shift_id" IS NOT NULL;
