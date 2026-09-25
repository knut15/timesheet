import type { Invite, Membership, Shift, Store, User } from "@prisma/client";

export const toUserDto = (u: User) => ({ id: u.id, email: u.email, nickname: u.nickname, createdAt: u.createdAt.toISOString() });

export const toStoreDto = (s: Store) => ({ id: s.id, name: s.name, lat: s.lat, lng: s.lng, fivePlus: s.fivePlus });

const terms = (m: Membership) => ({ hourlyWage: m.hourlyWage, weeklyHours: m.weeklyHours, workDaysPerWeek: m.workDaysPerWeek });

export const toMyMembershipDto = (m: Membership & { store: Store }) => ({ role: m.role, ...terms(m), store: toStoreDto(m.store) });

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
