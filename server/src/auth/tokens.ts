import { createHash, randomBytes, randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { env, JWT_AUDIENCE, JWT_ISSUER } from "../env.js";
import { AppError } from "../errors.js";

const key = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

export const randomToken = () => randomBytes(32).toString("base64url");
export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function signAccessToken(userId: string, sessionId: string): Promise<string> {
  return new SignJWT({ sid: sessionId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setJti(randomUUID())
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${env.ACCESS_TOKEN_TTL_SEC}s`)
    .sign(key);
}

/** 서명·만료·iss·aud 를 검사한다. alg 는 HS256 만 받는다 (alg:none 바꿔치기 차단). */
export async function verifyAccessToken(token: string): Promise<{ userId: string; sessionId: string }> {
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"], issuer: JWT_ISSUER, audience: JWT_AUDIENCE });
    if (typeof payload.sub !== "string" || typeof payload.sid !== "string") throw new Error("claims");
    return { userId: payload.sub, sessionId: payload.sid };
  } catch {
    throw new AppError(401, "ACCESS_TOKEN_INVALID");
  }
}
