# 11. 매장 로고

[← PRD 개요](README.md) · 매장 설정은 [07](07-admin.md) · 헤더는 [timesheet-ui](../../.claude/skills/timesheet-ui/SKILL.md)

## 목표

사장님(마스터)이 매장 로고를 올리면 **헤더 위 작은 줄(매장 이름 자리)에 로고가 보인다.** 마스터·멤버 화면 모두.

## 요구사항

| ID | 요구 | 수용 기준 |
|---|---|---|
| LG-1 | 업로드 | 매장 화면에서 PNG·JPG·SVG 파일을 올린다. 1MB 이하 |
| LG-2 | 형식 검사 | 확장자·Content-Type 이 아니라 **파일 첫 바이트**로 판정한다 (PNG 서명 `89 50 4E 47 0D 0A 1A 0A`, JPEG `FF D8 FF`, SVG 는 `<svg` 로 시작하는 XML). 맞지 않으면 400 `LOGO_INVALID` |
| LG-3 | SVG 안전 | `<script>`, `<foreignObject>`, `on*=` 속성, `javascript:`, 외부 참조(`href` 가 `#` 로 시작하지 않음), `<iframe>`·`<embed>`·`<object>` 가 있으면 400 `LOGO_INVALID`. 응답에도 `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; sandbox` 와 `X-Content-Type-Options: nosniff` |
| LG-4 | 크기 | 1MB 초과는 413 `PAYLOAD_TOO_LARGE` |
| LG-5 | 노출 | 헤더 eyebrow 줄에 로고(높이 20px, 가로 최대 96px, 비율 유지). **로고가 있으면 매장 이름 글자는 보이지 않는다**(2026-09-25 변경) — 멤버는 로고만, 마스터는 로고 · 사장님. 이름은 로고의 대체 텍스트로 읽힌다. 로고가 없으면 지금처럼 이름만 |
| LG-6 | 권한 | 올리기·지우기는 마스터(멤버 403). 보기는 그 매장 소속(마스터·멤버), 다른 매장·비로그인 401/404 |
| LG-7 | 교체·삭제 | 다시 올리면 바뀐다(주소의 `?v=` 가 바뀌어 캐시가 갱신). 지우면 이름만 |

## API

| 메서드·경로 | 누가 | 설명 |
|---|---|---|
| `PUT /api/stores/me/logo` | 마스터 | 본문 = 파일 바이트, `Content-Type: image/png·image/jpeg·image/svg+xml`. CSRF 헤더 필요 |
| `DELETE /api/stores/me/logo` | 마스터 | 204 |
| `GET /api/stores/me/logo` | 소속 | 이미지. 없으면 404 |
| `StoreDto.logoUrl` | — | `"/api/stores/me/logo?v=<수정 시각>"` 또는 `null` |

## 저장

`stores` 에 `logo`(bytea)·`logo_type`·`logo_updated_at` 컬럼. 로고는 작고 매장당 하나라 별도 파일 저장소를 두지 않는다.
**대가**: DB 크기가 매장당 최대 1MB 늘고, 이미지 요청이 API 함수를 거친다(`Cache-Control: private, max-age=1년` + 버전 주소로 반복 요청은 브라우저 캐시).

## 범위 밖

- 이미지 자르기·크기 조절 (올린 그대로, 화면에서 비율 유지로 줄인다)
- 다크 모드용 로고 따로 올리기
