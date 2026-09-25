import createClient from "openapi-fetch";
import type { components, paths } from "./schema";
import { authFetch } from "@/auth/session";

/** 앱 API 용. 쿠키 인증 + 변경 요청에 CSRF 헤더 자동, 401 이면 refresh 후 1회 재시도. 같은 출처(/api)로 부르고 Next rewrites 가 서버로 넘긴다. */
export const api = createClient<paths>({ credentials: "include", fetch: authFetch });

/** /api/auth/* 전용. 재시도 없이 그대로 — refresh 가 자기 자신을 부르지 않도록 분리한다. */
export const authApi = createClient<paths>({ credentials: "include" });

type S = components["schemas"];
export type SessionResponse = S["SessionResponse"];
export type User = S["UserDto"];
export type ErrorResponse = S["ErrorResponse"];
export type Me = S["MeDto"];
export type MyMembership = S["MyMembershipDto"];
export type Store = S["StoreDto"];
export type Member = S["MemberDto"];
export type ShiftDto = S["ShiftDto"];
export type Invite = S["InviteDto"];
export type Dashboard = S["DashboardDto"];

/** 서버 응답의 error 에서 code 를 꺼낸다. FE 는 message 가 아니라 code 로 분기한다. */
export const errorCode = (error: unknown) => (error as ErrorResponse | undefined)?.code;
export type Correction = S["CorrectionDto"];
export type LeaveReq = S["LeaveDto"];
export type Substitution = S["SubstitutionDto"];
export type Absence = S["AbsenceDto"];
export type Colleague = S["ColleagueDto"];
export type MyRequests = S["MyRequestsDto"];
export type StoreRequests = S["StoreRequestsDto"];
export type Schedule = S["ScheduleDto"];
export type ScheduleException = S["ScheduleExceptionDto"];
