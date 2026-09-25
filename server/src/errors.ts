import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { logger } from "./logger.js";

// 에러 코드. FE 는 message 가 아니라 code 로 분기한다. contract.ts 의 ErrorResponse 가 이 목록을 쓴다.
export const ERROR_CODES = [
  "VALIDATION_FAILED",
  "INVALID_CREDENTIALS",
  "ACCESS_TOKEN_INVALID",
  "REFRESH_TOKEN_INVALID",
  "REFRESH_TOKEN_REUSED",
  "REFRESH_TOKEN_ROTATED",
  "CSRF_ORIGIN_REJECTED",
  "CSRF_TOKEN_INVALID",
  "EMAIL_TAKEN",
  "TOO_MANY_REQUESTS",
  "FORBIDDEN",
  "NOT_FOUND",
  "NO_STORE",
  "ALREADY_IN_STORE",
  "INVITE_INVALID",
  "ALREADY_CLOCKED_IN",
  "NOT_CLOCKED_IN",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: ErrorCode,
    message: string = code,
  ) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ statusCode: err.statusCode, code: err.code, message: err.message });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({ statusCode: 400, code: "VALIDATION_FAILED", message: err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") });
    return;
  }
  logger.error({ err, path: req.path }, "unhandled");
  res.status(500).json({ statusCode: 500, code: "INTERNAL", message: "Internal Server Error" });
};
