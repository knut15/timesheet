// 멤버 자신의 출퇴근. docs/prd/01-attendance.md, docs/prd/06-store-invite.md
import { Router } from "express";
import { RangeQuery } from "../contract.js";
import { prisma } from "../db.js";
import { AppError } from "../errors.js";
import { requireAuth, requireMembership } from "../auth/guard.js";
import { toShiftDto } from "../lib/dto.js";

export const shiftRouter = Router();
shiftRouter.use("/shifts", requireAuth, requireMembership);

shiftRouter.get("/shifts/me", async (req, res) => {
  const { from, to } = RangeQuery.parse(req.query);
  const shifts = await prisma.shift.findMany({
    where: { userId: req.auth!.userId, storeId: req.membership!.storeId, OR: [{ start: { gte: new Date(from), lt: new Date(to) } }, { end: null }] },
    orderBy: { start: "asc" },
  });
  res.json(shifts.map(toShiftDto));
});

shiftRouter.post("/shifts/clock-in", async (req, res) => {
  try {
    const shift = await prisma.shift.create({
      data: { userId: req.auth!.userId, storeId: req.membership!.storeId, start: new Date() },
    });
    res.status(201).json(toShiftDto(shift));
  } catch (e) {
    // 열린 기록이 이미 있으면 부분 유니크 인덱스(shifts_one_open_per_user)가 막는다.
    if ((e as { code?: string }).code === "P2002") throw new AppError(409, "ALREADY_CLOCKED_IN");
    throw e;
  }
});

shiftRouter.post("/shifts/clock-out", async (req, res) => {
  const [shift] = await prisma.shift.updateManyAndReturn({
    where: { userId: req.auth!.userId, end: null },
    data: { end: new Date() },
  });
  if (!shift) throw new AppError(409, "NOT_CLOCKED_IN");
  res.json(toShiftDto(shift));
});
