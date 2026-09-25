// API 계약. 요청 검증 스키마와 OpenAPI 문서가 여기 한 곳에서 나온다.
// FE 는 이 문서로 만든 타입(web/src/api/schema.d.ts)만 본다. docs/prd/05·06·07
import { OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { ERROR_CODES } from "./errors.js";

export const registry = new OpenAPIRegistry();
const bearer = registry.registerComponent("securitySchemes", "bearer", { type: "http", scheme: "bearer", bearerFormat: "JWT" });
const secured = [{ [bearer.name]: [] }];

// ── 스키마 ─────────────────────────────────────────────
export const ErrorResponse = z
  .object({ statusCode: z.number().int(), code: z.enum([...ERROR_CODES, "INTERNAL"]), message: z.string() })
  .meta({ id: "ErrorResponse" });

export const UserDto = z
  .object({ id: z.string(), email: z.string(), nickname: z.string(), createdAt: z.string() })
  .meta({ id: "UserDto" });

export const TokenResponse = z
  .object({ accessToken: z.string(), tokenType: z.literal("Bearer"), expiresIn: z.number().int(), user: UserDto })
  .meta({ id: "TokenResponse" });

export const CsrfResponse = z.object({ csrfToken: z.string() }).meta({ id: "CsrfResponse" });

export const SignupBody = z
  .object({ email: z.email().max(254), password: z.string().min(8).max(128), nickname: z.string().trim().min(1).max(30) })
  .meta({ id: "SignupBody" });
export const LoginBody = z.object({ email: z.string().max(254), password: z.string().max(128) }).meta({ id: "LoginBody" });

export const Role = z.enum(["master", "member"]).meta({ id: "Role" });

export const StoreDto = z
  .object({ id: z.string(), name: z.string(), lat: z.number().nullable(), lng: z.number().nullable(), fivePlus: z.boolean() })
  .meta({ id: "StoreDto" });

export const PayTerms = {
  hourlyWage: z.number().int().min(0).max(1_000_000),
  weeklyHours: z.number().min(0).max(52),
  workDaysPerWeek: z.number().int().min(1).max(7),
};

export const MyMembershipDto = z
  .object({ role: Role, ...PayTerms, store: StoreDto })
  .meta({ id: "MyMembershipDto" });

// .nullable() 로 쓰면 생성기가 MyMembershipDto 자체를 nullable 로 만든다. union 으로 감싼다.
export const MeDto = z.object({ user: UserDto, membership: z.union([MyMembershipDto, z.null()]) }).meta({ id: "MeDto" });

export const CreateStoreBody = z.object({ name: z.string().trim().min(1).max(50) }).meta({ id: "CreateStoreBody" });
export const UpdateStoreBody = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    lat: z.number().min(-90).max(90).nullable().optional(),
    lng: z.number().min(-180).max(180).nullable().optional(),
    fivePlus: z.boolean().optional(),
  })
  .meta({ id: "UpdateStoreBody" });

export const InviteDto = z
  .object({
    id: z.string(),
    code: z.string(),
    createdAt: z.string(),
    expiresAt: z.string(),
    status: z.enum(["active", "used", "expired", "revoked"]),
    usedByNickname: z.string().nullable(),
  })
  .meta({ id: "InviteDto" });
export const RedeemBody = z.object({ code: z.string().max(32) }).meta({ id: "RedeemBody" });

export const MemberDto = z
  .object({ userId: z.string(), nickname: z.string(), email: z.string(), role: Role, ...PayTerms, joinedAt: z.string() })
  .meta({ id: "MemberDto" });
export const UpdateMemberBody = z
  .object({
    hourlyWage: PayTerms.hourlyWage.optional(),
    weeklyHours: PayTerms.weeklyHours.optional(),
    workDaysPerWeek: PayTerms.workDaysPerWeek.optional(),
  })
  .meta({ id: "UpdateMemberBody" });

export const ShiftDto = z
  .object({ id: z.string(), userId: z.string(), start: z.string(), end: z.string().nullable() })
  .meta({ id: "ShiftDto" });
export const UpdateShiftBody = z
  .object({ start: z.iso.datetime({ offset: true }), end: z.iso.datetime({ offset: true }).nullable() })
  .refine((b) => b.end === null || new Date(b.end) > new Date(b.start), { message: "end must be after start", path: ["end"] })
  .meta({ id: "UpdateShiftBody" });
export const RangeQuery = z.object({ from: z.iso.datetime({ offset: true }), to: z.iso.datetime({ offset: true }) });

export const DashboardQuery = z.object({ month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/) });
export const DashboardDto = z
  .object({ store: StoreDto, members: z.array(MemberDto), shifts: z.array(ShiftDto) })
  .meta({ id: "DashboardDto" });

// ── 경로 ───────────────────────────────────────────────
type Method = "get" | "post" | "patch" | "delete";
const json = (schema: z.ZodType, description = "OK") => ({ description, content: { "application/json": { schema } } });
const err = (description: string) => json(ErrorResponse, description);
const csrfHeader = z.object({ "x-csrf-token": z.string() });

function path(
  method: Method,
  p: string,
  summary: string,
  opts: { auth?: boolean; csrf?: boolean; body?: z.ZodType; query?: z.ZodObject; params?: z.ZodObject; ok: [number, z.ZodType | null]; errors?: Record<number, string> },
) {
  const [status, schema] = opts.ok;
  registry.registerPath({
    method,
    path: p,
    summary,
    security: opts.auth ? secured : undefined,
    request: {
      headers: opts.csrf ? csrfHeader : undefined,
      body: opts.body ? { content: { "application/json": { schema: opts.body } } } : undefined,
      query: opts.query,
      params: opts.params,
    },
    responses: {
      [status]: schema ? json(schema) : { description: "No Content" },
      ...Object.fromEntries(Object.entries(opts.errors ?? {}).map(([s, d]) => [s, err(d)])),
    },
  });
}

const id = (name: string) => z.object({ [name]: z.string() });

path("get", "/api/auth/csrf", "CSRF 토큰 발급", { ok: [200, CsrfResponse] });
path("post", "/api/auth/signup", "가입", { body: SignupBody, ok: [201, UserDto], errors: { 400: "VALIDATION_FAILED", 409: "EMAIL_TAKEN" } });
path("post", "/api/auth/login", "로그인", { csrf: true, body: LoginBody, ok: [200, TokenResponse], errors: { 401: "INVALID_CREDENTIALS", 403: "CSRF_*", 429: "TOO_MANY_REQUESTS" } });
path("post", "/api/auth/refresh", "토큰 회전", { csrf: true, ok: [200, TokenResponse], errors: { 401: "REFRESH_TOKEN_INVALID | REFRESH_TOKEN_REUSED", 403: "CSRF_*", 409: "REFRESH_TOKEN_ROTATED" } });
path("post", "/api/auth/logout", "로그아웃", { csrf: true, ok: [204, null], errors: { 403: "CSRF_*" } });
path("get", "/api/users/me", "내 정보와 소속", { auth: true, ok: [200, MeDto], errors: { 401: "ACCESS_TOKEN_INVALID" } });

path("post", "/api/stores", "매장 만들기 (마스터가 된다)", { auth: true, body: CreateStoreBody, ok: [201, MyMembershipDto], errors: { 409: "ALREADY_IN_STORE" } });
path("get", "/api/stores/me", "내 매장", { auth: true, ok: [200, StoreDto], errors: { 404: "NO_STORE" } });
path("patch", "/api/stores/me", "매장 설정 (마스터)", { auth: true, body: UpdateStoreBody, ok: [200, StoreDto], errors: { 403: "FORBIDDEN" } });
path("get", "/api/stores/me/invites", "초대 코드 목록 (마스터)", { auth: true, ok: [200, z.array(InviteDto)], errors: { 403: "FORBIDDEN" } });
path("post", "/api/stores/me/invites", "초대 코드 발급 (마스터)", { auth: true, ok: [201, InviteDto], errors: { 403: "FORBIDDEN" } });
path("delete", "/api/stores/me/invites/{inviteId}", "초대 코드 취소 (마스터)", { auth: true, params: id("inviteId"), ok: [204, null], errors: { 404: "NOT_FOUND" } });
path("post", "/api/invites/redeem", "초대 코드 등록 (멤버가 된다)", { auth: true, body: RedeemBody, ok: [200, MyMembershipDto], errors: { 400: "INVITE_INVALID", 409: "ALREADY_IN_STORE", 429: "TOO_MANY_REQUESTS" } });
path("get", "/api/stores/me/members", "멤버 목록 (마스터)", { auth: true, ok: [200, z.array(MemberDto)], errors: { 403: "FORBIDDEN" } });
path("patch", "/api/stores/me/members/{userId}", "멤버 급여 조건 (마스터)", { auth: true, params: id("userId"), body: UpdateMemberBody, ok: [200, MemberDto], errors: { 404: "NOT_FOUND" } });
path("delete", "/api/stores/me/members/{userId}", "멤버 내보내기 (마스터)", { auth: true, params: id("userId"), ok: [204, null], errors: { 404: "NOT_FOUND" } });
path("get", "/api/stores/me/members/{userId}/shifts", "멤버 근무 기록 (마스터)", { auth: true, params: id("userId"), query: RangeQuery, ok: [200, z.array(ShiftDto)], errors: { 404: "NOT_FOUND" } });
path("patch", "/api/stores/me/shifts/{shiftId}", "근무 기록 수정 (마스터)", { auth: true, params: id("shiftId"), body: UpdateShiftBody, ok: [200, ShiftDto], errors: { 404: "NOT_FOUND" } });
path("delete", "/api/stores/me/shifts/{shiftId}", "근무 기록 삭제 (마스터)", { auth: true, params: id("shiftId"), ok: [204, null], errors: { 404: "NOT_FOUND" } });
path("get", "/api/stores/me/dashboard", "대시보드 (마스터)", { auth: true, query: DashboardQuery, ok: [200, DashboardDto], errors: { 403: "FORBIDDEN" } });

path("get", "/api/shifts/me", "내 근무 기록", { auth: true, query: RangeQuery, ok: [200, z.array(ShiftDto)], errors: { 404: "NO_STORE" } });
path("post", "/api/shifts/clock-in", "출근", { auth: true, ok: [201, ShiftDto], errors: { 409: "ALREADY_CLOCKED_IN" } });
path("post", "/api/shifts/clock-out", "퇴근", { auth: true, ok: [200, ShiftDto], errors: { 409: "NOT_CLOCKED_IN" } });

export function openApiDocument() {
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: "3.1.0",
    info: { title: "timesheet API", version: "1.0.0" },
  });
}
