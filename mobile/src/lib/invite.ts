// 초대 링크(timesheet://join?code=…)로 받은 코드를 가입 과정 동안 기억한다. 웹은 sessionStorage, 앱은 앱이 켜져 있는 동안 메모리.
let code: string | null = null;
export const rememberInviteCode = (c: string) => (code = c.replace(/\s+/g, "").toUpperCase().slice(0, 16));
export const peekInviteCode = () => code;
export const clearInviteCode = () => (code = null);
