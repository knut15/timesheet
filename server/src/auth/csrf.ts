// CSRF 세 겹 중 Origin 검사와 서명된 double-submit. SameSite 는 쿠키 속성이 맡는다. (web-auth 스킬 csrf.md)
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { CookieOptions, RequestHandler } from "express";
import { env } from "../env.js";
import { AppError } from "../errors.js";

export const CSRF_COOKIE = "csrf_token";
export const csrfCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: "strict",
  path: "/",
  maxAge: 7200 * 1000,
};

const sign = (nonce: string) => createHmac("sha256", env.CSRF_SECRET).update(nonce).digest("base64url");

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function isValidCsrfToken(token: unknown): token is string {
  if (typeof token !== "string") return false;
  const [nonce, mac, ...rest] = token.split(".");
  return !!nonce && !!mac && rest.length === 0 && safeEqual(mac, sign(nonce));
}

/** 쿠키가 이미 유효하면 같은 값을 준다 — 탭마다 새로 만들면 마지막 탭만 짝이 맞는다. */
export function issueCsrfToken(existing: unknown): string {
  if (isValidCsrfToken(existing)) return existing;
  const nonce = randomBytes(32).toString("base64url");
  return `${nonce}.${sign(nonce)}`;
}

export const csrfGuard: RequestHandler = (req, _res, next) => {
  let origin = req.headers.origin;
  if (!origin && req.headers.referer) {
    try {
      origin = new URL(req.headers.referer).origin;
    } catch {
      origin = undefined;
    }
  }
  if (!origin || !env.WEB_ORIGINS.includes(origin)) return next(new AppError(403, "CSRF_ORIGIN_REJECTED"));

  const header = req.headers["x-csrf-token"];
  const cookie: unknown = req.cookies?.[CSRF_COOKIE];
  if (typeof header !== "string" || typeof cookie !== "string" || !safeEqual(header, cookie) || !isValidCsrfToken(header)) {
    return next(new AppError(403, "CSRF_TOKEN_INVALID"));
  }
  next();
};
