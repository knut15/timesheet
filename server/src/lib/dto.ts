import type { Invite, Membership, ScheduleException, Shift, Store, User } from "@prisma/client";

export const toUserDto = (u: User) => ({ id: u.id, email: u.email, nickname: u.nickname, createdAt: u.createdAt.toISOString() });

export const toStoreDto = (s: Omit<Store, "logo">) => ({
  id: s.id,
  name: s.name,
  lat: s.lat,
  lng: s.lng,
  fivePlus: s.fivePlus,
  logoUrl: s.logoUpdatedAt ? `/api/stores/me/logo?v=${s.logoUpdatedAt.getTime()}` : null,
});

// 시간표가 없으면(이 기능 전 멤버) null — 주 시간·일수는 옛 값 그대로 (docs/prd/13)
const schedule = (m: Membership) =>
  m.scheduleDays.length > 0 && m.scheduleStart && m.scheduleEnd ? { days: m.scheduleDays, start: m.scheduleStart, end: m.scheduleEnd } : null;
const terms = (m: Membership) => ({ hourlyWage: m.hourlyWage, weeklyHours: m.weeklyHours, workDaysPerWeek: m.workDaysPerWeek, schedule: schedule(m) });

export const toScheduleExceptionDto = (e: ScheduleException) => ({
  id: e.id,
  userId: e.userId,
  date: e.date.toISOString().slice(0, 10),
  kind: e.kind,
  start: e.start,
  end: e.end,
});

export const toMyMembershipDto = (m: Membership & { store: Omit<Store, "logo"> }) => ({ role: m.role, ...terms(m), store: toStoreDto(m.store) });

export const toMemberDto = (m: Membership & { user: User }) => ({
  userId: m.userId,
  nickname: m.user.nickname,
  email: m.user.email,
  role: m.role,
  ...terms(m),
  joinedAt: m.joinedAt.toISOString(),
});

export const toShiftDto = (s: Shift) => ({
  id: s.id,
  userId: s.userId,
  start: s.start.toISOString(),
  end: s.end ? s.end.toISOString() : null,
});

export function toInviteDto(i: Invite & { usedByUser?: { nickname: string } | null }, now = new Date()) {
  const status = i.revokedAt ? "revoked" : i.usedAt ? "used" : i.expiresAt <= now ? "expired" : "active";
  return {
    id: i.id,
    code: i.code,
    createdAt: i.createdAt.toISOString(),
    expiresAt: i.expiresAt.toISOString(),
    status,
    usedByUserId: i.usedBy,
    usedByNickname: i.usedByUser?.nickname ?? null,
  } as const;
}
