// 매장 로고 올리기·보기·지우기. docs/prd/11-store-logo.md
import express, { Router } from "express";
import { prisma } from "../db.js";
import { AppError } from "../errors.js";
import { requireAuth, requireMaster, requireMembership } from "../auth/guard.js";
import { toStoreDto } from "../lib/dto.js";

const MAX_BYTES = 1024 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/svg+xml"] as const;
type LogoType = (typeof TYPES)[number];

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff]);

/** SVG 안에서 스크립트가 돌거나 밖의 것을 불러올 수 있는 것들. 하나라도 있으면 거부한다 (정리하지 않고 거부 — 정리 규칙은 빠뜨리기 쉽다). */
const SVG_FORBIDDEN = [
  /<script/i,
  /<foreignObject/i,
  /<(iframe|embed|object)\b/i,
  /\son[a-z]+\s*=/i,
  /javascript:/i,
  /(?:xlink:)?href\s*=\s*["']\s*(?!#)/i,
  /<!ENTITY/i,
];

/** 첫 바이트로 형식을 판정한다. Content-Type 과 다르면 거부 — 이름만 바꾼 파일을 막는다 (LG-2). */
export function detectLogo(buf: Buffer, declared: string): LogoType {
  if (declared === "image/png" && buf.subarray(0, 8).equals(PNG)) return "image/png";
  if (declared === "image/jpeg" && buf.subarray(0, 3).equals(JPEG)) return "image/jpeg";
  if (declared === "image/svg+xml") {
    const text = buf.toString("utf8").replace(/^﻿/, "");
    const looksSvg = /^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg[\s>]/i.test(text);
    if (looksSvg && !SVG_FORBIDDEN.some((re) => re.test(text))) return "image/svg+xml";
  }
  throw new AppError(400, "LOGO_INVALID", "PNG·JPG·SVG 만, 스크립트·외부 참조 없는 파일만 올릴 수 있다");
}

export const logoRouter = Router();
const master = [requireAuth, requireMembership, requireMaster];

logoRouter.put(
  "/stores/me/logo",
  ...master,
  // 이 라우트에서만 원본 바이트를 받는다. 한도를 넘으면 body-parser 가 413 을 던진다
  express.raw({ type: [...TYPES], limit: MAX_BYTES }),
  async (req, res) => {
    const body: unknown = req.body;
    if (!Buffer.isBuffer(body) || body.length === 0) throw new AppError(400, "LOGO_INVALID", "PNG·JPG·SVG 파일 본문이 필요하다");
    const type = detectLogo(body, String(req.headers["content-type"] ?? "").split(";")[0]!.trim());
    const store = await prisma.store.update({
      where: { id: req.membership!.storeId },
      data: { logo: new Uint8Array(body), logoType: type, logoUpdatedAt: new Date() },
    });
    res.json(toStoreDto(store));
  },
);

logoRouter.delete("/stores/me/logo", ...master, async (req, res) => {
  await prisma.store.update({ where: { id: req.membership!.storeId }, data: { logo: null, logoType: null, logoUpdatedAt: null } });
  res.status(204).end();
});

logoRouter.get("/stores/me/logo", requireAuth, requireMembership, async (req, res) => {
  const store = await prisma.store.findUniqueOrThrow({ where: { id: req.membership!.storeId }, omit: { logo: false } });
  if (!store.logo || !store.logoType) throw new AppError(404, "NOT_FOUND");
  res.set({
    "Content-Type": store.logoType,
    "X-Content-Type-Options": "nosniff",
    // SVG 를 주소로 직접 열어도 스크립트가 돌지 않게 (LG-3). <img> 로 쓸 때는 영향이 없다
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    // 주소에 ?v=<수정 시각> 이 붙으므로 오래 캐시해도 교체가 반영된다 (LG-7). 로그인한 사람만 보므로 private
    "Cache-Control": "private, max-age=31536000, immutable",
  });
  res.send(Buffer.from(store.logo));
});
