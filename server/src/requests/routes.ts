// 기록 수정 요청, 휴가, 대타. docs/prd/08-correction-requests.md, docs/prd/09-leave-substitution.md
// 흐름·상태 규칙은 .claude/skills/timesheet-requests/SKILL.md 가 정본이다.
import { Router } from "express";
import type { Leave, Prisma, ShiftCorrection, Substitution, User } from "@prisma/client";
import {
  ApproveLeaveBody,
  CreateCorrectionBody,
  CreateLeaveBody,
  CreateSubstitutionBody,
  MasterCreateLeaveBody,
  MasterCreateSubstitutionBody,
  RangeQuery,
  ReviewBody,
} from "../contract.js";
import { prisma } from "../db.js";
import { AppError } from "../errors.js";
import { requireAuth, requireMaster, requireMembership } from "../auth/guard.js";

const DAY_MS = 86_400_000;
/** @db.Date 는 UTC 자정으로 온다. 날짜 문자열로만 다룬다. */
const toDay = (d: Date) => d.toISOString().slice(0, 10);
const fromDay = (s: string) => new Date(`${s}T00:00:00Z`);
const isP2002 = (e: unknown) => (e as { code?: string }).code === "P2002";

// ── DTO ────────────────────────────────────────────────
type CorrectionRow = ShiftCorrection & { user: User; shift: { start: Date; end: Date | null } | null };
const correctionInclude = { user: true, shift: { select: { start: true, end: true } } } as const;
export const toCorrectionDto = (c: CorrectionRow) => ({
  id: c.id,
  userId: c.userId,
  nickname: c.user.nickname,
  shiftId: c.shiftId,
  action: c.action,
  start: c.start?.toISOString() ?? null,
  end: c.end?.toISOString() ?? null,
  current: c.shift ? { start: c.shift.start.toISOString(), end: c.shift.end?.toISOString() ?? null } : null,
  reason: c.reason,
  status: c.status,
  reviewNote: c.reviewNote,
  createdAt: c.createdAt.toISOString(),
  reviewedAt: c.reviewedAt?.toISOString() ?? null,
});

const toLeaveDto = (l: Leave & { user: User }) => ({
  id: l.id,
  userId: l.userId,
  nickname: l.user.nickname,
  startDate: toDay(l.startDate),
  endDate: toDay(l.endDate),
  paid: l.status === "approved" ? l.paid : null,
  reason: l.reason,
  status: l.status,
  byMaster: l.createdBy !== l.userId,
  reviewNote: l.reviewNote,
  createdAt: l.createdAt.toISOString(),
});

const subInclude = { requester: true, substitute: true } as const;
const toSubDto = (s: Substitution & { requester: User; substitute: User }) => ({
  id: s.id,
  requesterId: s.requesterId,
  requesterNickname: s.requester.nickname,
  substituteId: s.substituteId,
  substituteNickname: s.substitute.nickname,
  date: toDay(s.date),
  reason: s.reason,
  status: s.status,
  reviewNote: s.reviewNote,
  createdAt: s.createdAt.toISOString(),
});

// ── 결근 아닌 날 (급여 계산용) ─────────────────────────
type Absence = { userId: string; date: string; kind: "paid_leave" | "unpaid_leave" | "substitution"; sourceId: string };

export async function absencesFor(storeId: string, fromIso: string, toIso: string, userId?: string): Promise<Absence[]> {
  const from = fromDay(fromIso.slice(0, 10));
  const to = fromDay(toIso.slice(0, 10));
  const [leaves, subs] = await Promise.all([
    prisma.leave.findMany({ where: { storeId, userId, status: "approved", startDate: { lte: to }, endDate: { gte: from } } }),
    prisma.substitution.findMany({ where: { storeId, requesterId: userId, status: "approved", date: { gte: from, lte: to } } }),
  ]);
  const out: Absence[] = [];
  for (const l of leaves) {
    for (let t = Math.max(l.startDate.getTime(), from.getTime()); t <= Math.min(l.endDate.getTime(), to.getTime()); t += DAY_MS) {
      out.push({ userId: l.userId, date: toDay(new Date(t)), kind: l.paid ? "paid_leave" : "unpaid_leave", sourceId: l.id });
    }
  }
  for (const s of subs) out.push({ userId: s.requesterId, date: toDay(s.date), kind: "substitution", sourceId: s.id });
  return out;
}

/** 대기·승인 휴가와 겹치면 409. 같은 사용자 기준. */
async function assertNoLeaveOverlap(userId: string, start: Date, end: Date) {
  const clash = await prisma.leave.count({
    where: { userId, status: { in: ["pending", "approved"] }, startDate: { lte: end }, endDate: { gte: start } },
  });
  if (clash > 0) throw new AppError(409, "LEAVE_OVERLAP");
}

/** 같은 매장 멤버여야 한다. 아니면 존재를 드러내지 않고 404. */
async function assertMemberOf(storeId: string, userId: string) {
  const m = await prisma.membership.findUnique({ where: { userId } });
  if (!m || m.storeId !== storeId) throw new AppError(404, "NOT_FOUND");
}

/** 조건부 전이. 없으면 404, 있는데 상태가 안 맞으면 409 REQUEST_CLOSED. */
async function transition(count: number, exists: () => Promise<boolean>) {
  if (count > 0) return;
  throw (await exists()) ? new AppError(409, "REQUEST_CLOSED") : new AppError(404, "NOT_FOUND");
}

export const requestsRouter = Router();
requestsRouter.use(["/corrections", "/leaves", "/substitutions", "/requests", "/absences"], requireAuth, requireMembership);
const master = [requireAuth, requireMembership, requireMaster];
const id = (p: unknown) => String(p);

// ── 멤버: 수정 요청 ─────────────────────────────────────
requestsRouter.post("/corrections", async (req, res) => {
  const body = CreateCorrectionBody.parse(req.body);
  const { userId, storeId } = req.membership!;
  if (body.shiftId) {
    const shift = await prisma.shift.findUnique({ where: { id: body.shiftId } });
    if (!shift || shift.userId !== userId || shift.storeId !== storeId) throw new AppError(404, "NOT_FOUND");
  }
  try {
    const c = await prisma.shiftCorrection.create({
      data: {
        storeId,
        userId,
        shiftId: body.shiftId ?? null,
        action: body.action,
        start: body.action === "delete" ? null : new Date(body.start!),
        end: body.action === "delete" ? null : new Date(body.end!),
        reason: body.reason,
      },
      include: correctionInclude,
    });
    res.status(201).json(toCorrectionDto(c));
  } catch (e) {
    if (isP2002(e)) throw new AppError(409, "REQUEST_PENDING");
    throw e;
  }
});

requestsRouter.post("/corrections/:id/cancel", async (req, res) => {
  const cid = id(req.params.id);
  const userId = req.membership!.userId;
  const { count } = await prisma.shiftCorrection.updateMany({ where: { id: cid, userId, status: "pending" }, data: { status: "canceled" } });
  await transition(count, async () => !!(await prisma.shiftCorrection.findFirst({ where: { id: cid, userId } })));
  res.json(toCorrectionDto(await prisma.shiftCorrection.findUniqueOrThrow({ where: { id: cid }, include: correctionInclude })));
});

// ── 멤버: 휴가 ─────────────────────────────────────────
requestsRouter.post("/leaves", async (req, res) => {
  const body = CreateLeaveBody.parse(req.body);
  const { userId, storeId } = req.membership!;
  const start = fromDay(body.startDate);
  const end = fromDay(body.endDate);
  await assertNoLeaveOverlap(userId, start, end);
  const l = await prisma.leave.create({
    // paid 는 승인 때 마스터가 정한다. 그 전 값은 쓰지 않는다 (DTO 에서 null)
    data: { storeId, userId, startDate: start, endDate: end, paid: false, reason: body.reason, createdBy: userId },
    include: { user: true },
  });
  res.status(201).json(toLeaveDto(l));
});

requestsRouter.post("/leaves/:id/cancel", async (req, res) => {
  const lid = id(req.params.id);
  const userId = req.membership!.userId;
  const { count } = await prisma.leave.updateMany({ where: { id: lid, userId, status: "pending" }, data: { status: "canceled" } });
  await transition(count, async () => !!(await prisma.leave.findFirst({ where: { id: lid, userId } })));
  res.json(toLeaveDto(await prisma.leave.findUniqueOrThrow({ where: { id: lid }, include: { user: true } })));
});

// ── 멤버: 대타 ─────────────────────────────────────────
requestsRouter.post("/substitutions", async (req, res) => {
  const body = CreateSubstitutionBody.parse(req.body);
  const { userId, storeId } = req.membership!;
  if (body.substituteId === userId) throw new AppError(400, "VALIDATION_FAILED", "자기 자신을 대타로 지정할 수 없다");
  await assertMemberOf(storeId, body.substituteId);
  const s = await prisma.substitution.create({
    data: { storeId, requesterId: userId, substituteId: body.substituteId, date: fromDay(body.date), reason: body.reason },
    include: subInclude,
  });
  res.status(201).json(toSubDto(s));
});

for (const [action, from, to] of [
  ["accept", "requested", "accepted"],
  ["decline", "requested", "declined"],
] as const) {
  requestsRouter.post(`/substitutions/:id/${action}`, async (req, res) => {
    const sid = id(req.params.id);
    const userId = req.membership!.userId;
    const { count } = await prisma.substitution.updateMany({
      where: { id: sid, substituteId: userId, status: from },
      data: { status: to, respondedAt: new Date() },
    });
    await transition(count, async () => !!(await prisma.substitution.findFirst({ where: { id: sid, substituteId: userId } })));
    res.json(toSubDto(await prisma.substitution.findUniqueOrThrow({ where: { id: sid }, include: subInclude })));
  });
}

requestsRouter.post("/substitutions/:id/cancel", async (req, res) => {
  const sid = id(req.params.id);
  const userId = req.membership!.userId;
  const { count } = await prisma.substitution.updateMany({
    where: { id: sid, requesterId: userId, status: { in: ["requested", "accepted"] } },
    data: { status: "canceled" },
  });
  await transition(count, async () => !!(await prisma.substitution.findFirst({ where: { id: sid, requesterId: userId } })));
  res.json(toSubDto(await prisma.substitution.findUniqueOrThrow({ where: { id: sid }, include: subInclude })));
});

// ── 멤버: 조회 ─────────────────────────────────────────
const recentFirst = { createdAt: "desc" as const };

requestsRouter.get("/requests/me", async (req, res) => {
  const { userId } = req.membership!;
  const [corrections, leaves, subsOut, subsIn] = await Promise.all([
    prisma.shiftCorrection.findMany({ where: { userId }, include: correctionInclude, orderBy: recentFirst, take: 100 }),
    prisma.leave.findMany({ where: { userId }, include: { user: true }, orderBy: recentFirst, take: 100 }),
    prisma.substitution.findMany({ where: { requesterId: userId }, include: subInclude, orderBy: recentFirst, take: 100 }),
    prisma.substitution.findMany({ where: { substituteId: userId }, include: subInclude, orderBy: recentFirst, take: 100 }),
  ]);
  res.json({
    corrections: corrections.map(toCorrectionDto),
    leaves: leaves.map(toLeaveDto),
    substitutionsOut: subsOut.map(toSubDto),
    substitutionsIn: subsIn.map(toSubDto),
  });
});

requestsRouter.get("/absences/me", async (req, res) => {
  const { from, to } = RangeQuery.parse(req.query);
  res.json(await absencesFor(req.membership!.storeId, from, to, req.membership!.userId));
});

requestsRouter.get("/stores/me/colleagues", requireAuth, requireMembership, async (req, res) => {
  const members = await prisma.membership.findMany({
    where: { storeId: req.membership!.storeId, role: "member", userId: { not: req.membership!.userId } },
    include: { user: true },
    orderBy: { joinedAt: "asc" },
  });
  res.json(members.map((m) => ({ userId: m.userId, nickname: m.user.nickname })));
});

// ── 마스터 ──────────────────────────────────────────────
/** 대기 먼저, 그 안에서 최신 먼저 */
const pendingFirst = <T extends { status: string; createdAt: Date }>(rows: T[], waiting: string[]) =>
  [...rows].sort((a, b) => Number(waiting.includes(b.status)) - Number(waiting.includes(a.status)) || b.createdAt.getTime() - a.createdAt.getTime());

requestsRouter.get("/stores/me/requests", ...master, async (req, res) => {
  const { storeId } = req.membership!;
  const [corrections, leaves, subs] = await Promise.all([
    prisma.shiftCorrection.findMany({ where: { storeId }, include: correctionInclude, orderBy: recentFirst, take: 200 }),
    prisma.leave.findMany({ where: { storeId }, include: { user: true }, orderBy: recentFirst, take: 200 }),
    prisma.substitution.findMany({ where: { storeId }, include: subInclude, orderBy: recentFirst, take: 200 }),
  ]);
  res.json({
    corrections: pendingFirst(corrections, ["pending"]).map(toCorrectionDto),
    leaves: pendingFirst(leaves, ["pending"]).map(toLeaveDto),
    substitutions: pendingFirst(subs, ["accepted", "requested"]).map(toSubDto),
  });
});

requestsRouter.get("/stores/me/absences", ...master, async (req, res) => {
  const { from, to } = RangeQuery.parse(req.query);
  res.json(await absencesFor(req.membership!.storeId, from, to));
});

/** 승인 대기 수 — 대시보드 배지. 대타는 수락된 것만 마스터 차례다. */
export async function pendingRequestCount(storeId: string) {
  const [c, l, s] = await Promise.all([
    prisma.shiftCorrection.count({ where: { storeId, status: "pending" } }),
    prisma.leave.count({ where: { storeId, status: "pending" } }),
    prisma.substitution.count({ where: { storeId, status: "accepted" } }),
  ]);
  return c + l + s;
}

requestsRouter.post("/stores/me/corrections/:id/approve", ...master, async (req, res) => {
  const { note } = ReviewBody.parse(req.body ?? {});
  const cid = id(req.params.id);
  const { storeId } = req.membership!;
  try {
    // 요청 상태와 기록을 한 트랜잭션에서. 기록이 사라졌으면 404 로 롤백되고 요청은 대기로 남는다.
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const c = await tx.shiftCorrection.findUnique({ where: { id: cid } });
      if (!c || c.storeId !== storeId) throw new AppError(404, "NOT_FOUND");
      if (c.status !== "pending") throw new AppError(409, "REQUEST_CLOSED");
      if (c.action === "add") {
        await tx.shift.create({ data: { storeId, userId: c.userId, start: c.start!, end: c.end } });
      } else {
        const shift = c.shiftId ? await tx.shift.findUnique({ where: { id: c.shiftId } }) : null;
        if (!shift || shift.storeId !== storeId) throw new AppError(404, "NOT_FOUND", "대상 기록이 없다");
        if (c.action === "edit") await tx.shift.update({ where: { id: shift.id }, data: { start: c.start!, end: c.end } });
        else await tx.shift.delete({ where: { id: shift.id } });
      }
      await tx.shiftCorrection.update({ where: { id: cid }, data: { status: "approved", reviewNote: note ?? null, reviewedAt: new Date() } });
    });
  } catch (e) {
    if (isP2002(e)) throw new AppError(409, "ALREADY_CLOCKED_IN");
    throw e;
  }
  res.json(toCorrectionDto(await prisma.shiftCorrection.findUniqueOrThrow({ where: { id: cid }, include: correctionInclude })));
});

requestsRouter.post("/stores/me/corrections/:id/reject", ...master, async (req, res) => {
  const { note } = ReviewBody.parse(req.body ?? {});
  const cid = id(req.params.id);
  const { storeId } = req.membership!;
  const { count } = await prisma.shiftCorrection.updateMany({
    where: { id: cid, storeId, status: "pending" },
    data: { status: "rejected", reviewNote: note ?? null, reviewedAt: new Date() },
  });
  await transition(count, async () => !!(await prisma.shiftCorrection.findFirst({ where: { id: cid, storeId } })));
  res.json(toCorrectionDto(await prisma.shiftCorrection.findUniqueOrThrow({ where: { id: cid }, include: correctionInclude })));
});

requestsRouter.post("/stores/me/leaves", ...master, async (req, res) => {
  const body = MasterCreateLeaveBody.parse(req.body);
  const { storeId, userId: masterId } = req.membership!;
  await assertMemberOf(storeId, body.userId);
  const start = fromDay(body.startDate);
  const end = fromDay(body.endDate);
  await assertNoLeaveOverlap(body.userId, start, end);
  const l = await prisma.leave.create({
    data: { storeId, userId: body.userId, startDate: start, endDate: end, paid: body.paid, reason: body.reason, status: "approved", createdBy: masterId, reviewedAt: new Date() },
    include: { user: true },
  });
  res.status(201).json(toLeaveDto(l));
});

requestsRouter.post("/stores/me/leaves/:id/approve", ...master, async (req, res) => {
  const body = ApproveLeaveBody.parse(req.body ?? {});
  const lid = id(req.params.id);
  const { storeId } = req.membership!;
  const { count } = await prisma.leave.updateMany({
    where: { id: lid, storeId, status: "pending" },
    data: { status: "approved", paid: body.paid, reviewNote: body.note ?? null, reviewedAt: new Date() },
  });
  await transition(count, async () => !!(await prisma.leave.findFirst({ where: { id: lid, storeId } })));
  res.json(toLeaveDto(await prisma.leave.findUniqueOrThrow({ where: { id: lid }, include: { user: true } })));
});

requestsRouter.post("/stores/me/leaves/:id/reject", ...master, async (req, res) => {
  const { note } = ReviewBody.parse(req.body ?? {});
  const lid = id(req.params.id);
  const { storeId } = req.membership!;
  const { count } = await prisma.leave.updateMany({
    where: { id: lid, storeId, status: "pending" },
    data: { status: "rejected", reviewNote: note ?? null, reviewedAt: new Date() },
  });
  await transition(count, async () => !!(await prisma.leave.findFirst({ where: { id: lid, storeId } })));
  res.json(toLeaveDto(await prisma.leave.findUniqueOrThrow({ where: { id: lid }, include: { user: true } })));
});

requestsRouter.delete("/stores/me/leaves/:id", ...master, async (req, res) => {
  const { count } = await prisma.leave.deleteMany({ where: { id: id(req.params.id), storeId: req.membership!.storeId } });
  if (count === 0) throw new AppError(404, "NOT_FOUND");
  res.status(204).end();
});

requestsRouter.post("/stores/me/substitutions", ...master, async (req, res) => {
  const body = MasterCreateSubstitutionBody.parse(req.body);
  const { storeId } = req.membership!;
  if (body.requesterId === body.substituteId) throw new AppError(400, "VALIDATION_FAILED", "요청자와 대타가 같다");
  await assertMemberOf(storeId, body.requesterId);
  await assertMemberOf(storeId, body.substituteId);
  const s = await prisma.substitution.create({
    data: { storeId, requesterId: body.requesterId, substituteId: body.substituteId, date: fromDay(body.date), reason: body.reason, status: "approved", reviewedAt: new Date() },
    include: subInclude,
  });
  res.status(201).json(toSubDto(s));
});

requestsRouter.post("/stores/me/substitutions/:id/approve", ...master, async (req, res) => {
  const { note } = ReviewBody.parse(req.body ?? {});
  const sid = id(req.params.id);
  const { storeId } = req.membership!;
  const { count } = await prisma.substitution.updateMany({
    where: { id: sid, storeId, status: "accepted" },
    data: { status: "approved", reviewNote: note ?? null, reviewedAt: new Date() },
  });
  if (count === 0) {
    const s = await prisma.substitution.findFirst({ where: { id: sid, storeId } });
    if (!s) throw new AppError(404, "NOT_FOUND");
    throw s.status === "requested" ? new AppError(409, "SUBSTITUTE_NOT_ACCEPTED") : new AppError(409, "REQUEST_CLOSED");
  }
  res.json(toSubDto(await prisma.substitution.findUniqueOrThrow({ where: { id: sid }, include: subInclude })));
});

requestsRouter.post("/stores/me/substitutions/:id/reject", ...master, async (req, res) => {
  const { note } = ReviewBody.parse(req.body ?? {});
  const sid = id(req.params.id);
  const { storeId } = req.membership!;
  const { count } = await prisma.substitution.updateMany({
    where: { id: sid, storeId, status: { in: ["requested", "accepted"] } },
    data: { status: "rejected", reviewNote: note ?? null, reviewedAt: new Date() },
  });
  await transition(count, async () => !!(await prisma.substitution.findFirst({ where: { id: sid, storeId } })));
  res.json(toSubDto(await prisma.substitution.findUniqueOrThrow({ where: { id: sid }, include: subInclude })));
});

requestsRouter.delete("/stores/me/substitutions/:id", ...master, async (req, res) => {
  const { count } = await prisma.substitution.deleteMany({ where: { id: id(req.params.id), storeId: req.membership!.storeId } });
  if (count === 0) throw new AppError(404, "NOT_FOUND");
  res.status(204).end();
});
