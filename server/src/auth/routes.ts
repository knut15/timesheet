import argon2 from "argon2";
import { Router, type CookieOptions, type Request, type Response } from "express";
import { rateLimit } from "express-rate-limit";
import { Prisma } from "@prisma/client";
import { LoginBody, SignupBody } from "../contract.js";
import { prisma } from "../db.js";
import { env } from "../env.js";
import { AppError } from "../errors.js";
import { toMyMembershipDto, toUserDto } from "../lib/dto.js";
import { CSRF_COOKIE, csrfCookieOptions, csrfGuard, issueCsrfToken } from "./csrf.js";
import { requireAuth } from "./guard.js";
import { issueRefreshToken, revokeFamilyByToken, rotateRefreshToken, type Issued } from "./refresh.js";
import { signAccessToken } from "./tokens.js";

const REFRESH_COOKIE = "refresh_token";
// 쿠키 Path 는 프록시 뒤 브라우저가 보는 경로 기준이다 (docs/prd/05-auth.md 토폴로지).
const refreshCookieBase: CookieOptions = { httpOnly: true, secure: env.COOKIE_SECURE, sameSite: "strict", path: "/api/auth" };
const ARGON2 = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

// 없는 이메일에도 같은 시간을 쓰게 하는 더미 해시. 응답 시간으로 가입 여부가 드러나지 않게 한다.
const dummyHash = argon2.hash("timing-equalizer", ARGON2);

const meta = (req: Request) => ({ userAgent: req.headers["user-agent"] ?? null, ip: req.ip ?? null });

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, refreshCookieBase);
}

async function sendTokens(res: Response, issued: Issued) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: issued.userId } });
  res.cookie(REFRESH_COOKIE, issued.token, { ...refreshCookieBase, expires: issued.expiresAt });
  res.set("Cache-Control", "no-store");
  res.json({
    accessToken: await signAccessToken(issued.userId, issued.familyId),
    tokenType: "Bearer",
    expiresIn: env.ACCESS_TOKEN_TTL_SEC,
    user: toUserDto(user),
  });
}

const loginLimiter = rateLimit({
  windowMs: 60_000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  // trust proxy 를 켠 것은 알고 한 일이다 (app.ts). 경고를 끈다.
  validate: { trustProxy: false },
  handler: (_req, _res, next) => next(new AppError(429, "TOO_MANY_REQUESTS")),
});

export const authRouter = Router();

authRouter.get("/auth/csrf", (req, res) => {
  const token = issueCsrfToken(req.cookies?.[CSRF_COOKIE]);
  res.cookie(CSRF_COOKIE, token, csrfCookieOptions);
  res.set("Cache-Control", "no-store");
  res.json({ csrfToken: token });
});

authRouter.post("/auth/signup", async (req, res) => {
  const body = SignupBody.parse(req.body);
  try {
    const user = await prisma.user.create({
      data: { email: body.email.toLowerCase(), nickname: body.nickname, passwordHash: await argon2.hash(body.password, ARGON2) },
    });
    res.status(201).json(toUserDto(user));
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new AppError(409, "EMAIL_TAKEN");
    throw e;
  }
});

authRouter.post("/auth/login", loginLimiter, csrfGuard, async (req, res) => {
  const body = LoginBody.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
  const ok = await argon2.verify(user?.passwordHash ?? (await dummyHash), body.password);
  if (!user || !ok) throw new AppError(401, "INVALID_CREDENTIALS");
  await sendTokens(res, await issueRefreshToken(user.id, meta(req)));
});

authRouter.post("/auth/refresh", csrfGuard, async (req, res) => {
  const token: unknown = req.cookies?.[REFRESH_COOKIE];
  try {
    if (typeof token !== "string") throw new AppError(401, "REFRESH_TOKEN_INVALID");
    await sendTokens(res, await rotateRefreshToken(token, meta(req)));
  } catch (e) {
    // 401 이면 죽은 쿠키를 지운다. 409(grace 안의 동시 요청)는 앞 요청이 새 쿠키를 이미 내려보냈으니 건드리지 않는다.
    if (e instanceof AppError && e.statusCode === 401) clearRefreshCookie(res);
    throw e;
  }
});

authRouter.post("/auth/logout", csrfGuard, async (req, res) => {
  const token: unknown = req.cookies?.[REFRESH_COOKIE];
  if (typeof token === "string") await revokeFamilyByToken(token);
  clearRefreshCookie(res);
  res.status(204).end();
});

authRouter.get("/users/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
    include: { membership: { include: { store: true } } },
  });
  if (!user) throw new AppError(401, "ACCESS_TOKEN_INVALID");
  res.json({ user: toUserDto(user), membership: user.membership ? toMyMembershipDto(user.membership) : null });
});
