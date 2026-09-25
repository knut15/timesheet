// 초대 링크와 문자 본문. docs/prd/06-store-invite.md "초대 코드 보내기"
const KEY = "timesheet.inviteCode";

/** 가입 과정(다른 화면으로 이동)을 지나도 같은 탭 안에서는 코드가 남도록 sessionStorage 에 둔다. */
export function rememberInviteCode(code: string) {
  try {
    sessionStorage.setItem(KEY, code.replace(/\s+/g, "").toUpperCase().slice(0, 16));
  } catch {
    // 저장이 막힌 브라우저 — 사용자가 코드를 직접 넣으면 된다
  }
}

/** 읽기만 한다. 지우는 것은 등록에 성공한 뒤 (clearInviteCode) — 렌더 중에 지우면 두 번째 렌더가 빈 값을 받는다. */
export function peekInviteCode(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearInviteCode() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // 무시
  }
}

export const joinUrl = (origin: string, code: string) => `${origin}/join?code=${encodeURIComponent(code)}`;

export const inviteMessage = (storeName: string, code: string, url: string) =>
  `[${storeName}] 타임시트 초대\n초대 코드: ${code}\n아래 주소에서 가입하면 코드가 자동으로 들어가요 (7일 동안 1번).\n${url}`;

/**
 * 휴대폰 문자 앱을 여는 주소. 번호가 없으면 받는 사람은 문자 앱에서 고른다.
 * `?&body=` 는 iOS(`&body`)와 Android(`?body`) 둘 다 읽는 형태다.
 */
export const smsHref = (phone: string, body: string) => `sms:${phone.replace(/[^\d+]/g, "")}?&body=${encodeURIComponent(body)}`;
