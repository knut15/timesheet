// 리프레시 토큰 발급·회전·재사용 탐지·폐기. 절차는 web-auth 스킬 refresh-rotation.md 그대로다.
import { randomUUID } from "node:crypto";
import { prisma } from "../db.js";
import { env } from "../env.js";
import { AppError } from "../errors.js";
import { randomToken, sha256 } from "./tokens.js";

export type Issued = { token: string; userId: string; familyId: string; expiresAt: Date };
type Meta = { userAgent: string | null; ip: string | null };

const GRACE_SEC = 10;

export async function issueRefreshToken(userId: string, meta: Meta): Promise<Issued> {
  const token = randomToken();
  const familyId = randomUUID();
  const now = Date.now();
  const sessionExpiresAt = new Date(now + env.SESSION_MAX_AGE_SEC * 1000);
  const expiresAt = new Date(Math.min(now + env.REFRESH_TOKEN_TTL_SEC * 1000, sessionExpiresAt.getTime()));
  await prisma.refreshToken.create({
    data: { userId, familyId, tokenHash: sha256(token), expiresAt, sessionExpiresAt, ...meta },
  });
  return { token, userId, familyId, expiresAt };
}

type RotateResult =
  | { kind: "ok"; issued: Issued }
  | { kind: "invalid" }
  | { kind: "reused" }
  | { kind: "rotated" };

type Row = {
  id: string;
  user_id: string;
  family_id: string;
  revoked_at: Date | null;
  revoke_reason: string | null;
  session_expires_at: Date;
  within_grace: boolean;
  expired: boolean;
  family_alive: boolean;
};

/**
 * 한 트랜잭션 안에서 판정하고, 결과를 COMMIT 한 뒤에 에러를 던진다.
 * 탐지 UPDATE 뒤에 트랜잭션 안에서 던지면 롤백되어 폐기가 사라진다.
 */
export async function rotateRefreshToken(token: string, meta: Meta): Promise<Issued> {
  const hash = sha256(token);
  const result = await prisma.$transaction(async (tx): Promise<RotateResult> => {
    const fam = await tx.$queryRaw<{ family_id: string }[]>`
      SELECT family_id FROM refresh_tokens WHERE token_hash = ${hash}`;
    const familyId = fam[0]?.family_id;
    if (!familyId) return { kind: "invalid" };

    // family 잠금을 먼저, 행 잠금을 나중에 — 정상 회전과 재사용 탐지를 한 줄로 세운다.
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${familyId}::text, 0))`;

    const rows = await tx.$queryRaw<Row[]>`
      SELECT t.id, t.user_id, t.family_id, t.revoked_at, t.revoke_reason::text AS revoke_reason, t.session_expires_at,
             (t.revoked_at IS NOT NULL AND t.revoked_at > now() - make_interval(secs => ${GRACE_SEC})) AS within_grace,
             (t.expires_at <= now()) AS expired,
             EXISTS (SELECT 1 FROM refresh_tokens f WHERE f.family_id = t.family_id AND f.revoked_at IS NULL) AS family_alive
        FROM refresh_tokens t
       WHERE t.token_hash = ${hash}
         FOR UPDATE OF t`;
    const row = rows[0];
    if (!row) return { kind: "invalid" };

    if (row.revoke_reason === "reuse_detected") return { kind: "reused" };
    if (row.revoked_at) {
      if (row.revoke_reason !== "rotated" || !row.family_alive) return { kind: "invalid" };
      if (row.within_grace) return { kind: "rotated" };
      await tx.$executeRaw`
        UPDATE refresh_tokens SET revoked_at = now(), revoke_reason = 'reuse_detected'
         WHERE family_id = ${row.family_id}::uuid AND revoked_at IS NULL`;
      return { kind: "reused" };
    }
    if (row.expired) return { kind: "invalid" };

    const next = randomToken();
    // 슬라이딩: 쓸 때마다 세션 한도를 지금부터 다시 잡는다. 안 쓰면 마지막 회전 뒤 SESSION_MAX_AGE_SEC 에 끊긴다.
    const sessionExpiresAt = new Date(Date.now() + env.SESSION_MAX_AGE_SEC * 1000);
    const expiresAt = new Date(Math.min(Date.now() + env.REFRESH_TOKEN_TTL_SEC * 1000, sessionExpiresAt.getTime()));
    const created = await tx.refreshToken.create({
      data: {
        userId: row.user_id,
        familyId: row.family_id,
        tokenHash: sha256(next),
        expiresAt,
        sessionExpiresAt,
        ...meta,
      },
    });
    // 기록도 DB 시계로 — grace 판정이 같은 시계로 비교하게 한다.
    await tx.$executeRaw`
      UPDATE refresh_tokens SET revoked_at = now(), revoke_reason = 'rotated', replaced_by = ${created.id}::uuid
       WHERE id = ${row.id}::uuid`;
    return { kind: "ok", issued: { token: next, userId: row.user_id, familyId: row.family_id, expiresAt } };
  });

  switch (result.kind) {
    case "ok":
      return result.issued;
    case "invalid":
      throw new AppError(401, "REFRESH_TOKEN_INVALID");
    case "reused":
      throw new AppError(401, "REFRESH_TOKEN_REUSED");
    case "rotated":
      throw new AppError(409, "REFRESH_TOKEN_ROTATED");
  }
}

/** 로그아웃. 없는 토큰이어도 조용히 끝난다 (멱등). */
export async function revokeFamilyByToken(token: string): Promise<void> {
  const row = await prisma.refreshToken.findUnique({ where: { tokenHash: sha256(token) }, select: { familyId: true } });
  if (!row) return;
  await prisma.refreshToken.updateMany({
    where: { familyId: row.familyId, revokedAt: null },
    data: { revokedAt: new Date(), revokeReason: "logout" },
  });
}
