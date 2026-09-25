// API 계약. 요청 검증 스키마와 OpenAPI 문서가 여기 한 곳에서 나온다.
// FE 는 이 문서로 만든 타입(web/src/api/schema.d.ts)만 본다. docs/prd/05·06·07
import { OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { ERROR_CODES } from "./errors.js";

export const registry = new OpenAPIRegistry();
// 액세스 토큰은 HttpOnly 쿠키다. 브라우저가 자동으로 싣는다.
const cookieAuth = registry.registerComponent("securitySchemes", "accessCookie", { type: "apiKey", in: "cookie", name: "access_token" });
const secured = [{ [cookieAuth.name]: [] }];

// ── 스키마 ─────────────────────────────────────────────
export const ErrorResponse = z
  .object({ statusCode: z.number().int(), code: z.enum([...ERROR_CODES, "INTERNAL"]), message: z.string() })
  .meta({ id: "ErrorResponse" });

export const UserDto = z
  .object({ id: z.string(), email: z.string(), nickname: z.string(), createdAt: z.string() })
  .meta({ id: "UserDto" });

// 토큰은 본문에 없다 — access_token·refresh_token 쿠키로 간다.
export const SessionResponse = z.object({ expiresIn: z.number().int(), user: UserDto }).meta({ id: "SessionResponse" });

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
    usedByUserId: z.string().nullable(),
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

// ── 수정 요청·휴가·대타 (docs/prd/08·09) ─────────────────
const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Reason = z.string().trim().min(1).max(200);
export const RequestStatus = z.enum(["pending", "approved", "rejected", "canceled"]).meta({ id: "RequestStatus" });

export const CorrectionDto = z
  .object({
    id: z.string(),
    userId: z.string(),
    nickname: z.string(),
    shiftId: z.string().nullable(),
    action: z.enum(["edit", "add", "delete"]),
    start: z.string().nullable(),
    end: z.string().nullable(),
    // 승인 화면에서 전·후를 비교하려고 지금 기록 시각을 같이 준다
    current: z.union([z.object({ start: z.string(), end: z.string().nullable() }), z.null()]),
    reason: z.string(),
    status: RequestStatus,
    reviewNote: z.string().nullable(),
    createdAt: z.string(),
    reviewedAt: z.string().nullable(),
  })
  .meta({ id: "CorrectionDto" });
export const CreateCorrectionBody = z
  .object({
    action: z.enum(["edit", "add", "delete"]),
    shiftId: z.string().optional(),
    start: z.iso.datetime({ offset: true }).optional(),
    end: z.iso.datetime({ offset: true }).optional(),
    reason: Reason,
  })
  .refine((b) => (b.action === "add" ? !b.shiftId : !!b.shiftId), { message: "add 는 shiftId 없이, edit·delete 는 shiftId 필수", path: ["shiftId"] })
  .refine((b) => b.action === "delete" || (!!b.start && !!b.end && new Date(b.end) > new Date(b.start)), {
    message: "edit·add 는 start < end 필수",
    path: ["end"],
  })
  .meta({ id: "CreateCorrectionBody" });

export const LeaveDto = z
  .object({
    id: z.string(),
    userId: z.string(),
    nickname: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    paid: z.boolean(),
    reason: z.string(),
    status: RequestStatus,
    byMaster: z.boolean(),
    reviewNote: z.string().nullable(),
    createdAt: z.string(),
  })
  .meta({ id: "LeaveDto" });
const leaveRange = <T extends z.ZodObject<{ startDate: typeof Day; endDate: typeof Day }>>(o: T) =>
  o
    .refine((b) => b.endDate >= b.startDate, { message: "endDate >= startDate", path: ["endDate"] })
    .refine((b) => (Date.parse(b.endDate) - Date.parse(b.startDate)) / 86_400_000 < 30, { message: "최대 30일", path: ["endDate"] });
export const CreateLeaveBody = leaveRange(z.object({ startDate: Day, endDate: Day, paid: z.boolean(), reason: Reason })).meta({ id: "CreateLeaveBody" });
export const MasterCreateLeaveBody = leaveRange(
  z.object({ userId: z.string(), startDate: Day, endDate: Day, paid: z.boolean(), reason: Reason }),
).meta({ id: "MasterCreateLeaveBody" });

export const SubstitutionDto = z
  .object({
    id: z.string(),
    requesterId: z.string(),
    requesterNickname: z.string(),
    substituteId: z.string(),
    substituteNickname: z.string(),
    date: z.string(),
    reason: z.string(),
    status: z.enum(["requested", "accepted", "declined", "approved", "rejected", "canceled"]),
    reviewNote: z.string().nullable(),
    createdAt: z.string(),
  })
  .meta({ id: "SubstitutionDto" });
export const CreateSubstitutionBody = z.object({ date: Day, substituteId: z.string(), reason: Reason }).meta({ id: "CreateSubstitutionBody" });
export const MasterCreateSubstitutionBody = z
  .object({ requesterId: z.string(), substituteId: z.string(), date: Day, reason: Reason })
  .meta({ id: "MasterCreateSubstitutionBody" });

export const ReviewBody = z.object({ note: z.string().trim().max(200).optional() }).meta({ id: "ReviewBody" });
export const ApproveLeaveBody = z.object({ paid: z.boolean().optional(), note: z.string().trim().max(200).optional() }).meta({ id: "ApproveLeaveBody" });

export const AbsenceDto = z
  .object({ userId: z.string(), date: z.string(), kind: z.enum(["paid_leave", "unpaid_leave", "substitution"]), sourceId: z.string() })
  .meta({ id: "AbsenceDto" });
export const ColleagueDto = z.object({ userId: z.string(), nickname: z.string() }).meta({ id: "ColleagueDto" });

export const MyRequestsDto = z
  .object({
    corrections: z.array(CorrectionDto),
    leaves: z.array(LeaveDto),
    substitutionsOut: z.array(SubstitutionDto),
    substitutionsIn: z.array(SubstitutionDto),
  })
  .meta({ id: "MyRequestsDto" });
export const StoreRequestsDto = z
  .object({ corrections: z.array(CorrectionDto), leaves: z.array(LeaveDto), substitutions: z.array(SubstitutionDto) })
  .meta({ id: "StoreRequestsDto" });

export const DashboardQuery = z.object({ month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/) });
export const DashboardDto = z
  .object({
    store: StoreDto,
    members: z.array(MemberDto),
    shifts: z.array(ShiftDto),
    absences: z.array(AbsenceDto),
    pendingRequests: z.number().int(),
  })
  .meta({ id: "DashboardDto" });

// ── 경로 ───────────────────────────────────────────────
type Method = "get" | "post" | "patch" | "delete";
const json = (schema: z.ZodType, description = "OK") => ({ description, content: { "application/json": { schema } } });
const err = (description: string) => json(ErrorResponse, description);
// 서버는 필수로 검사한다(app.ts). 계약에서 optional 인 것은 FE fetch 래퍼(authFetch)가 자동으로 붙이기 때문이다 —
// 필수로 두면 생성된 타입이 모든 호출에 헤더를 요구한다.
const csrfHeader = z.object({ "x-csrf-token": z.string().optional() });

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
      // GET 이 아닌 요청은 전부 CSRF 헤더가 필요하다 (app.ts)
      headers: opts.csrf || method !== "get" ? csrfHeader : undefined,
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
path("post", "/api/auth/login", "로그인", { csrf: true, body: LoginBody, ok: [200, SessionResponse], errors: { 401: "INVALID_CREDENTIALS", 403: "CSRF_*", 429: "TOO_MANY_REQUESTS" } });
path("post", "/api/auth/refresh", "토큰 회전", { csrf: true, ok: [200, SessionResponse], errors: { 401: "REFRESH_TOKEN_INVALID | REFRESH_TOKEN_REUSED", 403: "CSRF_*", 409: "REFRESH_TOKEN_ROTATED" } });
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

const rid = id("id");
path("post", "/api/corrections", "기록 수정 요청", { auth: true, body: CreateCorrectionBody, ok: [201, CorrectionDto], errors: { 404: "NOT_FOUND", 409: "REQUEST_PENDING" } });
path("post", "/api/corrections/{id}/cancel", "수정 요청 취소", { auth: true, params: rid, ok: [200, CorrectionDto], errors: { 409: "REQUEST_CLOSED" } });
path("post", "/api/leaves", "휴가 신청", { auth: true, body: CreateLeaveBody, ok: [201, LeaveDto], errors: { 409: "LEAVE_OVERLAP" } });
path("post", "/api/leaves/{id}/cancel", "휴가 신청 취소", { auth: true, params: rid, ok: [200, LeaveDto], errors: { 409: "REQUEST_CLOSED" } });
path("post", "/api/substitutions", "대타 요청", { auth: true, body: CreateSubstitutionBody, ok: [201, SubstitutionDto], errors: { 404: "NOT_FOUND" } });
path("post", "/api/substitutions/{id}/accept", "대타 수락 (지정된 대타)", { auth: true, params: rid, ok: [200, SubstitutionDto], errors: { 409: "REQUEST_CLOSED" } });
path("post", "/api/substitutions/{id}/decline", "대타 거절 (지정된 대타)", { auth: true, params: rid, ok: [200, SubstitutionDto], errors: { 409: "REQUEST_CLOSED" } });
path("post", "/api/substitutions/{id}/cancel", "대타 요청 취소", { auth: true, params: rid, ok: [200, SubstitutionDto], errors: { 409: "REQUEST_CLOSED" } });
path("get", "/api/requests/me", "내 요청 전부", { auth: true, ok: [200, MyRequestsDto] });
path("get", "/api/absences/me", "내 결근 아닌 날", { auth: true, query: RangeQuery, ok: [200, z.array(AbsenceDto)] });
path("get", "/api/stores/me/colleagues", "같은 매장 동료", { auth: true, ok: [200, z.array(ColleagueDto)] });

path("get", "/api/stores/me/requests", "매장 요청 전부 (마스터)", { auth: true, ok: [200, StoreRequestsDto], errors: { 403: "FORBIDDEN" } });
path("get", "/api/stores/me/absences", "매장 결근 아닌 날 (마스터)", { auth: true, query: RangeQuery, ok: [200, z.array(AbsenceDto)], errors: { 403: "FORBIDDEN" } });
path("post", "/api/stores/me/corrections/{id}/approve", "수정 요청 승인 (마스터)", { auth: true, params: rid, body: ReviewBody, ok: [200, CorrectionDto], errors: { 409: "REQUEST_CLOSED | ALREADY_CLOCKED_IN", 404: "NOT_FOUND" } });
path("post", "/api/stores/me/corrections/{id}/reject", "수정 요청 거절 (마스터)", { auth: true, params: rid, body: ReviewBody, ok: [200, CorrectionDto], errors: { 409: "REQUEST_CLOSED" } });
path("post", "/api/stores/me/leaves", "휴가 직접 등록 (마스터)", { auth: true, body: MasterCreateLeaveBody, ok: [201, LeaveDto], errors: { 409: "LEAVE_OVERLAP", 404: "NOT_FOUND" } });
path("post", "/api/stores/me/leaves/{id}/approve", "휴가 승인 (마스터)", { auth: true, params: rid, body: ApproveLeaveBody, ok: [200, LeaveDto], errors: { 409: "REQUEST_CLOSED" } });
path("post", "/api/stores/me/leaves/{id}/reject", "휴가 거절 (마스터)", { auth: true, params: rid, body: ReviewBody, ok: [200, LeaveDto], errors: { 409: "REQUEST_CLOSED" } });
path("delete", "/api/stores/me/leaves/{id}", "휴가 삭제 (마스터)", { auth: true, params: rid, ok: [204, null], errors: { 404: "NOT_FOUND" } });
path("post", "/api/stores/me/substitutions", "대타 직접 등록 (마스터)", { auth: true, body: MasterCreateSubstitutionBody, ok: [201, SubstitutionDto], errors: { 404: "NOT_FOUND" } });
path("post", "/api/stores/me/substitutions/{id}/approve", "대타 승인 (마스터)", { auth: true, params: rid, body: ReviewBody, ok: [200, SubstitutionDto], errors: { 409: "SUBSTITUTE_NOT_ACCEPTED | REQUEST_CLOSED" } });
path("post", "/api/stores/me/substitutions/{id}/reject", "대타 거절 (마스터)", { auth: true, params: rid, body: ReviewBody, ok: [200, SubstitutionDto], errors: { 409: "REQUEST_CLOSED" } });
path("delete", "/api/stores/me/substitutions/{id}", "대타 삭제 (마스터)", { auth: true, params: rid, ok: [204, null], errors: { 404: "NOT_FOUND" } });

export function openApiDocument() {
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: "3.1.0",
    info: { title: "timesheet API", version: "1.0.0" },
  });
}
