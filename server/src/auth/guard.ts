import type { Membership } from "@prisma/client";
import type { RequestHandler } from "express";
import { prisma } from "../db.js";
import { AppError } from "../errors.js";
import { verifyAccessToken } from "./tokens.js";

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; sessionId: string };
      membership?: Membership;
    }
  }
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next(new AppError(401, "ACCESS_TOKEN_INVALID"));
  try {
    req.auth = await verifyAccessToken(header.slice(7));
    next();
  } catch (e) {
    next(e);
  }
};

/** 매장 소속이 있어야 한다. requireAuth 뒤에 둔다. */
export const requireMembership: RequestHandler = async (req, _res, next) => {
  const membership = await prisma.membership.findUnique({ where: { userId: req.auth!.userId } });
  if (!membership) return next(new AppError(404, "NO_STORE"));
  req.membership = membership;
  next();
};

export const requireMaster: RequestHandler = (req, _res, next) => {
  if (req.membership?.role !== "master") return next(new AppError(403, "FORBIDDEN"));
  next();
};

/** 소속이 없어야 한다 (매장 만들기·초대 코드 등록). */
export const requireNoMembership: RequestHandler = async (req, _res, next) => {
  const membership = await prisma.membership.findUnique({ where: { userId: req.auth!.userId } });
  if (membership) return next(new AppError(409, "ALREADY_IN_STORE"));
  next();
};
