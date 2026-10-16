// API 클라이언트 — 계약 타입은 웹과 같은 생성물(web/src/api/schema.d.ts)을 쓴다. 원본은 server/src/contract.ts.
// 앱은 서버를 직접 부른다. 모든 요청에 X-Client: native 를 싣고, 인증은 Authorization: Bearer (docs/prd/14-native-app.md).
import createClient from "openapi-fetch";
import type { components, paths } from "../../../web/src/api/schema";
import { API_URL, nativeFetch } from "@/auth/session";

/** 앱 API 용. 액세스 토큰을 싣고, 401 이면 refresh 후 1회 재시도한다 */
export const api = createClient<paths>({ baseUrl: API_URL, fetch: nativeFetch });

type S = components["schemas"];
export type User = S["UserDto"];
export type ErrorResponse = S["ErrorResponse"];
export type Me = S["MeDto"];
export type MyMembership = S["MyMembershipDto"];
export type Store = S["StoreDto"];
export type Member = S["MemberDto"];
export type ShiftDto = S["ShiftDto"];
export type Invite = S["InviteDto"];
export type Dashboard = S["DashboardDto"];
export type Correction = S["CorrectionDto"];
export type LeaveReq = S["LeaveDto"];
export type Substitution = S["SubstitutionDto"];
export type Absence = S["AbsenceDto"];
export type Colleague = S["ColleagueDto"];
export type MyRequests = S["MyRequestsDto"];
export type StoreRequests = S["StoreRequestsDto"];
export type Schedule = S["ScheduleDto"];
export type ScheduleException = S["ScheduleExceptionDto"];

/** 서버 응답의 error 에서 code 를 꺼낸다. 앱도 message 가 아니라 code 로 분기한다 */
export const errorCode = (error: unknown) => (error as ErrorResponse | undefined)?.code;
