// 매장·초대·멤버·대시보드. docs/prd/06-store-invite.md, docs/prd/07-admin.md
import { randomInt } from "node:crypto";
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  CreateScheduleExceptionBody,
  CreateStoreBody,
  DashboardQuery,
  FromDayQuery,
  RangeQuery,
  RedeemBody,
  UpdateMemberBody,
  UpdateShiftBody,
  UpdateStoreBody,
  scheduleTerms,
} from "../contract.js";
import { prisma } from "../db.js";
import { AppError } from "../errors.js";
import { requireAuth, requireMaster, requireMembership, requireNoMembership } from "../auth/guard.js";
import { toInviteDto, toMemberDto, toMyMembershipDto, toScheduleExceptionDto, toShiftDto, toStoreDto } from "../lib/dto.js";
import { absencesFor, pendingRequestCount } from "../requests/routes.js";

const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 0·O·1·I 제외
const INVITE_TTL_MS = 7 * 86_400_000;
const DAY_MS = 86_400_000;

export const newInviteCode = () => Array.from({ length: 8 }, () => INVITE_ALPHABET[randomInt(INVITE_ALPHABET.length)]).join("");
export const normalizeCode = (raw: string) => raw.replace(/\s+/g, "").toUpperCase();

const redeemLimiter = rateLimit({
  windowMs: 60_000,
  limit: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => req.auth!.userId,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  // trust proxy 를 켠 것은 알고 한 일이다 (app.ts). 경고를 끈다.
  validate: { trustProxy: false },
  handler: (_req, _res, next) => next(new AppError(429, "TOO_MANY_REQUESTS")),
});

export const storeRouter = Router();
storeRouter.use(["/stores", "/invites"], requireAuth);

// ── 소속 만들기 ─────────────────────────────────────────
storeRouter.post("/stores", requireNoMembership, async (req, res) => {
  const body = CreateStoreBody.parse(req.body);
  const membership = await prisma.membership.create({
    data: { role: "master", user: { connect: { id: req.auth!.userId } }, store: { create: { name: body.name } } },
    include: { store: true },
  });
  res.status(201).json(toMyMembershipDto(membership));
});

storeRouter.post("/invites/redeem", requireNoMembership, redeemLimiter, async (req, res) => {
  const code = normalizeCode(RedeemBody.parse(req.body).code);
  const userId = req.auth!.userId;
  // 조건부 UPDATE 한 번으로 "아직 안 쓰였고 유효한 코드" 를 선점한다 — 동시에 두 명이 써도 한 명만 성공한다.
  const membership = await prisma.$transaction(async (tx) => {
    const claimed = await tx.invite.updateManyAndReturn({
      where: { code, usedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date(), usedBy: userId },
    });
    const invite = claimed[0];
    if (!invite) throw new AppError(400, "INVITE_INVALID");
    return tx.membership.create({ data: { userId, storeId: invite.storeId, role: "member" }, include: { store: true } });
  });
  res.json(toMyMembershipDto(membership));
});

// ── 소속 있음 ──────────────────────────────────────────
storeRouter.get("/stores/me", requireMembership, async (req, res) => {
  const store = await prisma.store.findUniqueOrThrow({ where: { id: req.membership!.storeId } });
  res.json(toStoreDto(store));
});

// ── 마스터 ──────────────────────────────────────────────
const master = [requireMembership, requireMaster];

storeRouter.patch("/stores/me", ...master, async (req, res) => {
  const body = UpdateStoreBody.parse(req.body);
  const store = await prisma.store.update({ where: { id: req.membership!.storeId }, data: body });
  res.json(toStoreDto(store));
});

storeRouter.get("/stores/me/invites", ...master, async (req, res) => {
  const invites = await prisma.invite.findMany({
    where: { storeId: req.membership!.storeId },
    include: { usedByUser: { select: { nickname: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(invites.map((i) => toInviteDto(i)));
});

storeRouter.post("/stores/me/invites", ...master, async (req, res) => {
  // 32^8 공간이라 충돌은 드물다. 그래도 유니크 위반이면 몇 번 다시 뽑는다.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const invite = await prisma.invite.create({
        data: { storeId: req.membership!.storeId, code: newInviteCode(), expiresAt: new Date(Date.now() + INVITE_TTL_MS) },
      });
      res.status(201).json(toInviteDto(invite));
      return;
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002") throw e;
    }
  }
  throw new Error("invite code collision");
});

storeRouter.delete("/stores/me/invites/:inviteId", ...master, async (req, res) => {
  const { count } = await prisma.invite.updateMany({
    where: { id: String(req.params.inviteId), storeId: req.membership!.storeId, usedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (count === 0) throw new AppError(404, "NOT_FOUND");
  res.status(204).end();
});

storeRouter.get("/stores/me/members", ...master, async (req, res) => {
  const members = await prisma.membership.findMany({
    where: { storeId: req.membership!.storeId },
    include: { user: true },
    orderBy: { joinedAt: "asc" },
  });
  res.json(members.map(toMemberDto));
});

/** 같은 매장 멤버만. 다른 매장이면 존재를 드러내지 않고 404. */
async function findMember(storeId: string, userId: string) {
  const m = await prisma.membership.findUnique({ where: { userId }, include: { user: true } });
  if (!m || m.storeId !== storeId) throw new AppError(404, "NOT_FOUND");
  return m;
}

storeRouter.patch("/stores/me/members/:userId", ...master, async (req, res) => {
  const body = UpdateMemberBody.parse(req.body);
  const m = await findMember(req.membership!.storeId, String(req.params.userId));
  const data = {
    hourlyWage: body.hourlyWage,
    // 시간표를 받으면 주 시간·주 일수를 거기서 계산해 같이 저장한다 (docs/prd/13)
    ...(body.schedule && {
      scheduleDays: [...body.schedule.days].sort(),
      scheduleStart: body.schedule.start,
      scheduleEnd: body.schedule.end,
      ...scheduleTerms(body.schedule),
    }),
  };
  const updated = await prisma.membership.update({ where: { userId: m.userId }, data, include: { user: true } });
  res.json(toMemberDto(updated));
});

// 날짜별 근무 변경 — 마스터만 정한다. date 는 기기 시간대의 YYYY-MM-DD 그대로 (휴가·대타와 같은 방식)
const fromDay = (s: string) => new Date(`${s}T00:00:00Z`);

storeRouter.get("/stores/me/members/:userId/schedule-exceptions", ...master, async (req, res) => {
  const { from } = FromDayQuery.parse(req.query);
  const m = await findMember(req.membership!.storeId, String(req.params.userId));
  const list = await prisma.scheduleException.findMany({
    where: { storeId: m.storeId, userId: m.userId, date: { gte: fromDay(from) } },
    orderBy: { date: "asc" },
  });
  res.json(list.map(toScheduleExceptionDto));
});

storeRouter.post("/stores/me/members/:userId/schedule-exceptions", ...master, async (req, res) => {
  const body = CreateScheduleExceptionBody.parse(req.body);
  const m = await findMember(req.membership!.storeId, String(req.params.userId));
  const fields = { kind: body.kind, start: body.start ?? null, end: body.end ?? null };
  // 한 멤버·한 날짜에 하나 — 다시 등록하면 덮어쓴다
  const e = await prisma.scheduleException.upsert({
    where: { userId_date: { userId: m.userId, date: fromDay(body.date) } },
    create: { storeId: m.storeId, userId: m.userId, date: fromDay(body.date), ...fields },
    update: { storeId: m.storeId, ...fields },
  });
  res.json(toScheduleExceptionDto(e));
});

storeRouter.delete("/stores/me/schedule-exceptions/:id", ...master, async (req, res) => {
  const { count } = await prisma.scheduleException.deleteMany({ where: { id: String(req.params.id), storeId: req.membership!.storeId } });
  if (count === 0) throw new AppError(404, "NOT_FOUND");
  res.status(204).end();
});

storeRouter.get("/schedule-exceptions/me", requireAuth, requireMembership, async (req, res) => {
  const { from } = FromDayQuery.parse(req.query);
  const list = await prisma.scheduleException.findMany({
    where: { storeId: req.membership!.storeId, userId: req.membership!.userId, date: { gte: fromDay(from) } },
    orderBy: { date: "asc" },
  });
  res.json(list.map(toScheduleExceptionDto));
});

storeRouter.delete("/stores/me/members/:userId", ...master, async (req, res) => {
  const m = await findMember(req.membership!.storeId, String(req.params.userId));
  if (m.role === "master") throw new AppError(403, "FORBIDDEN", "마스터는 퇴사처리할 수 없다");
  // 열린 기록을 닫고 소속만 지운다. 근무 기록은 남는다.
  await prisma.$transaction([
    prisma.shift.updateMany({ where: { userId: m.userId, end: null }, data: { end: new Date() } }),
    prisma.scheduleException.deleteMany({ where: { userId: m.userId, storeId: m.storeId } }),
    prisma.membership.delete({ where: { userId: m.userId } }),
  ]);
  res.status(204).end();
});

storeRouter.get("/stores/me/members/:userId/shifts", ...master, async (req, res) => {
  const { from, to } = RangeQuery.parse(req.query);
  const m = await findMember(req.membership!.storeId, String(req.params.userId));
  const shifts = await prisma.shift.findMany({
    where: { storeId: m.storeId, userId: m.userId, start: { gte: new Date(from), lt: new Date(to) } },
    orderBy: { start: "asc" },
  });
  res.json(shifts.map(toShiftDto));
});

async function findStoreShift(storeId: string, shiftId: string) {
  const s = await prisma.shift.findUnique({ where: { id: shiftId } });
  if (!s || s.storeId !== storeId) throw new AppError(404, "NOT_FOUND");
  return s;
}

storeRouter.patch("/stores/me/shifts/:shiftId", ...master, async (req, res) => {
  const body = UpdateShiftBody.parse(req.body);
  const s = await findStoreShift(req.membership!.storeId, String(req.params.shiftId));
  try {
    const updated = await prisma.shift.update({
      where: { id: s.id },
      data: { start: new Date(body.start), end: body.end ? new Date(body.end) : null },
    });
    res.json(toShiftDto(updated));
  } catch (e) {
    // 퇴근을 비워 열린 기록이 둘이 되면 부분 유니크 인덱스가 막는다.
    if ((e as { code?: string }).code === "P2002") throw new AppError(409, "ALREADY_CLOCKED_IN");
    throw e;
  }
});

storeRouter.delete("/stores/me/shifts/:shiftId", ...master, async (req, res) => {
  const s = await findStoreShift(req.membership!.storeId, String(req.params.shiftId));
  await prisma.shift.delete({ where: { id: s.id } });
  res.status(204).end();
});

storeRouter.get("/stores/me/dashboard", ...master, async (req, res) => {
  const { month } = DashboardQuery.parse(req.query);
  const [y, mo] = month.split("-").map(Number) as [number, number];
  // 월을 걸친 주까지 FE 가 계산할 수 있게 앞뒤로 8일씩 넉넉히 준다. 시간대 차이도 이 여유가 흡수한다.
  const from = new Date(Date.UTC(y, mo - 1, 1) - 8 * DAY_MS);
  const to = new Date(Date.UTC(y, mo, 1) + 8 * DAY_MS);
  const storeId = req.membership!.storeId;
  const [store, members, shifts, absences, pendingRequests] = await Promise.all([
    prisma.store.findUniqueOrThrow({ where: { id: storeId } }),
    prisma.membership.findMany({ where: { storeId }, include: { user: true }, orderBy: { joinedAt: "asc" } }),
    prisma.shift.findMany({
      where: { storeId, OR: [{ start: { gte: from, lt: to } }, { end: null }] },
      orderBy: { start: "asc" },
    }),
    absencesFor(storeId, from.toISOString(), to.toISOString()),
    pendingRequestCount(storeId),
  ]);
  // 내보낸 멤버의 기록은 대시보드에서 뺀다.
  const ids = new Set(members.map((m) => m.userId));
  res.json({
    store: toStoreDto(store),
    members: members.map(toMemberDto),
    shifts: shifts.filter((s) => ids.has(s.userId)).map(toShiftDto),
    absences: absences.filter((a) => ids.has(a.userId)),
    pendingRequests,
  });
});
