# 14. 네이티브 앱 (iOS·Android)

[← PRD 개요](README.md) · 로그인은 [05-auth.md](05-auth.md) · 출근 알림은 [04-geofence-notification.md](04-geofence-notification.md)

## 목표

웹앱과 같은 기능을 휴대폰 앱으로도 쓴다. 앱으로 옮기는 가장 큰 이유는 출근 알림이다. 웹은 탭을 열어 둔 동안에만 매장 근처인지 알 수 있었다. 앱은 닫혀 있어도 매장 50m 안에 들어오면 알린다.

2026-10-15 사용자 결정:

| 물음 | 답 |
|---|---|
| 방식 | React Native(Expo)로 화면을 새로 만든다. 웹을 감싸는 방식(Capacitor)·PWA 는 쓰지 않는다 |
| 플랫폼 | iOS·Android 둘 다. 이 Mac 에 Android 빌드 도구가 없어 지금 실제로 띄워 확인하는 것은 iOS 시뮬레이터뿐이다 |
| 범위 | 멤버·마스터 화면 전부 |
| 로그인 | 앱 전용 토큰 방식을 서버에 더한다 (아래 "로그인") |

## 구조

| 폴더 | 내용 |
|---|---|
| `mobile/` | Expo SDK 57 · React Native 0.86 · expo-router. pnpm 워크스페이스의 한 패키지(`timesheet-mobile`) |
| `mobile/app/` | 화면 경로. `member/` 탭 다섯, `admin/(tabs)/` 탭 다섯, `admin/members/[userId]`·`admin/invites` 하위 화면, `login`·`signup`·`onboarding`·`join` |
| `mobile/src/` | 공통 UI(`components/`), 세션(`auth/`), 화면(`screens/`), 지오펜스(`lib/geofence.ts`) |

계산 로직은 웹과 같은 파일을 쓴다. `mobile/tsconfig.json` 의 `@shared/*` 가 `web/src/lib/*` 를 가리킨다. 급여(`pay.ts`)·달력(`calendar.ts`)·오늘 판정(`today.ts`)·시간표(`schedule.ts`)·거리(`geo.ts`)가 앱과 웹에서 한 벌이다. API 타입도 웹이 생성한 `web/src/api/schema.d.ts` 를 그대로 쓴다.

화면 문구·순서·숫자 형식은 웹과 같다. 색·모서리·글꼴 값은 `mobile/src/theme.ts` 에 있고, 원본은 [DESIGN.md](../../DESIGN.md) 다. 앱도 항상 다크다.

## 로그인

앱에는 브라우저 쿠키가 없다. 그래서 웹의 HttpOnly 쿠키 + CSRF 방식을 그대로 쓸 수 없다. 앱이 보내는 요청에는 `X-Client: native` 헤더가 붙고, 서버는 이 헤더를 보고 아래처럼 다르게 처리한다. 웹 요청은 아무것도 바뀌지 않는다.

| | 웹 | 앱 (`X-Client: native`) |
|---|---|---|
| 로그인·refresh 응답 | 쿠키 두 개, 본문 `{ expiresIn, user }` | 쿠키 없음, 본문에 `accessToken`·`refreshToken`·`refreshExpiresAt` 추가 |
| 액세스 토큰 전달 | `access_token` 쿠키 | `Authorization: Bearer <토큰>`. 쿠키는 보지 않는다 |
| refresh·로그아웃 | 쿠키 | 본문 `{ refreshToken }` |
| CSRF 검사 | 모든 변경 요청 | 하지 않는다 |
| 액세스 토큰 보관 | (JS 가 보지 않는다) | 메모리 |
| 리프레시 토큰 보관 | HttpOnly 쿠키 | 기기 보안 저장소 (iOS Keychain / Android Keystore, `expo-secure-store`) |

회전, 재사용 탐지, 10초 grace, 30일 슬라이딩은 웹과 똑같이 서버가 한다.

CSRF 를 건너뛰어도 되는 이유는 이렇다. 다른 사이트의 브라우저 스크립트가 `X-Client` 나 `Authorization` 같은 헤더를 붙이려면 CORS 사전 요청을 거쳐야 하는데, 이 서버는 CORS 를 열지 않는다. 그리고 앱 모드에서는 쿠키를 아예 읽지 않으니, 피해자 브라우저의 쿠키를 빌려 쓸 길도 없다.

코드는 `server/src/auth/client.ts`(판정), `app.ts`(CSRF), `guard.ts`(Bearer), `routes.ts`(본문 토큰), 앱 쪽은 `mobile/src/auth/session.ts` 다.

## 출근 알림 — 앱이 닫혀 있어도

[04](04-geofence-notification.md) 의 G-1~G-9 를 그대로 지키되, 위치를 받는 방법이 다르다.

| | 웹 | 앱 |
|---|---|---|
| 위치 | 탭이 열린 동안 `watchPosition` | OS 지역 감시(iOS Region Monitoring · Android Geofencing API)에 매장 반경 50m 를 건다 (`expo-location` `startGeofencingAsync`) |
| 들어올 때 | 5초마다 판정해 알림 | OS 가 앱을 깨운다. 첫 알림을 바로 보내고 재알림을 60초 뒤로 예약한다 |
| 나갈 때 | 상태 초기화 | 예약한 재알림을 취소한다 |
| 출근하면 | 판정에서 빠진다 | 앱이 재알림을 취소하고 "오늘 출근함" 을 저장한다. 그날은 들어와도 알리지 않는다 |
| 권한 | 알림 + 위치 | 알림 + 위치 "앱 사용 중" + 위치 "항상" |

화면이 열려 있으면 매장까지 거리, GPS 정확도, 알림 상태(G-8)를 보여 준다. 화면을 닫아 두면 위치 갱신은 OS 감시가 맡는다.

남은 한계가 있다.

- 다른 기기(웹)에서 출근하면, 앱이 다음에 열릴 때까지 그 사실을 모른다. 그 사이에 예약해 둔 재알림이 한 번 울릴 수 있다.
- OS 지역 감시는 GPS 오차 때문에 실제 경계보다 조금 늦거나 이르게 들어온 것으로 볼 수 있다. iOS 는 반경이 작으면 진입 판정을 늦게 하는 편이다.
- 알림을 누르면 앱이 열린다. 출근 탭으로 바로 옮겨 가지는 않는다.

## 웹과 다른 점

| 무엇 | 앱 | 이유 |
|---|---|---|
| 움직임 | `react-native-reanimated`. 값(0.32초·8px·0.06초 간격 등)은 [DESIGN.md](../../DESIGN.md) §5 와 같다 | GSAP 은 브라우저 화면 요소를 움직이는 라이브러리라 앱 화면에 쓸 수 없다 |
| 그래프 | 주 시간 게이지는 `react-native-svg`, 근무일 점·주간 리듬 카드는 일반 View | Recharts 는 웹 전용이다 |
| 날짜·시각 입력 | 글자로 쓴다 (`2026-10-16`, `09:00`, `2026-10-16 09:00`). 보내기 전에 형식과 실제 날짜인지 검사한다 | 날짜 고르기 라이브러리를 들이지 않았다 |
| 고르기(select) | 버튼 목록 | 앱에는 select 가 없다 |
| 초대 코드 복사 | "공유" 시트(그 안에서 복사)와 문자 앱 열기 | 클립보드 라이브러리를 들이지 않았다 |
| 매장 로고 | 사진 보관함에서 골라 올린다 (`expo-image-picker`, 2026-10-16 사용자 승인) | — |
| 초대 링크 | `timesheet://join?code=…` 로 열면 코드가 채워진다. 웹 주소(`/join?code=`)로 앱을 여는 것(유니버설 링크)은 아직 없다 | 도메인 연결 설정이 필요하다 |
| 넓은 화면 두 줄 배치 | 한 줄로만 | 휴대폰 전용 |

## 실행

```bash
pnpm --filter timesheet-server dev                    # API (앱 개발 빌드는 기본 http://localhost:4200)
cd mobile && pnpm exec expo run:ios                   # 처음: 네이티브 빌드 + 시뮬레이터 설치 + Metro
cd mobile && pnpm start                               # 그 뒤: Metro 만
EXPO_PUBLIC_API_URL=http://localhost:4201 pnpm exec expo run:ios   # 다른 API 주소로
```

배포 빌드(`__DEV__` 가 아닐 때)는 운영 API `https://timesheet-api-hazel.vercel.app` 를 부른다. 스토어 배포(EAS·인증서·심사)는 이번 범위에 없다.

## 수용 기준

| ID | 기준 | 확인 |
|---|---|---|
| N1 | 앱 로그인 응답에 토큰이 본문으로 오고 쿠키는 없다 | `server/test/native.test.ts` |
| N2 | Bearer 로 인증된다. `X-Client` 없이 Bearer 만이면 401 (웹 규칙 그대로) | 같음 |
| N3 | 앱 모드에서는 `access_token` 쿠키를 무시한다 | 같음 |
| N4·N5 | 앱 모드 변경 요청은 CSRF 없이 통과, 같은 요청을 웹 모드로 보내면 403 | 같음 |
| N6·N7 | 본문 refresh 로 회전, grace 안 재사용 409, grace 뒤 재사용 401 + 세션 폐기 | 같음 |
| N8·N9 | 본문 로그아웃이 세션을 끊는다, 토큰 없는 refresh 401 | 같음 |
| N10 | 웹의 기존 인증 시나리오가 그대로 통과한다 | `server/test/e2e.test.ts` |
| N11 | iOS 시뮬레이터에서 로그인·멤버 탭 다섯·마스터 탭 다섯·하위 화면 둘이 열린다 | [검증 기록](../verify/auth.md) "네이티브 앱" |
| N12 | 앱을 닫은 채 매장 반경에 들어오면 알림이 온다 | 실기기에서 사람이 확인해야 한다 |
