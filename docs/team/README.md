# timesheet 팀 운영

[문서 목차](../README.md) · [역할과 권한](roles.md) · [작업 카드 양식](task-template.md) · [운영 스킬](../../.agents/skills/timesheet-team/SKILL.md)

6개 역할을 필요할 때 호출한다. 시니어가 기술 분할·통합을 맡고 현재 대화의 부모 에이전트가 상태를 관리한다. 별도 상시 관리자나 백그라운드 실행기는 없다.

## 사용

timesheet를 작업 폴더로 열고 다음처럼 요청한다.

- `timesheet 팀으로 TS-001을 진행해줘. 기존 작업을 확인하고 이어서 해.`
- `QA 담당으로 기록 수정 요청을 검증해줘.`
- `마케팅 담당으로 사장님 대상 소개 문구 초안을 만들어줘.`

Codex: `.agents/skills/timesheet-team`과 `.codex/agents/`의 역할 정의를 사용한다.
Claude Code: `.claude/skills/timesheet-team`과 `.claude/agents/`를 사용한다.
역할 지침은 roles.md 한곳에서 관리한다. 플랫폼 파일은 해당 절을 읽도록 연결만 한다. 새 세션에서 프로젝트를 열어 인식을 확인한다. 호스트가 사용자 정의 에이전트를 지원하지 않으면 역할 문서를 읽어 위임하고 그 사실을 보고한다.

구성 파일이 작업을 저절로 시작하지는 않는다. 팀 요청을 받은 대화 안에서 실행하며 지원되는 동시 실행 수를 따른다. 모든 역할의 모델과 실행 권한은 부모 설정을 상속한다.

## 작업 목록

| 작업 | 등록 상태 | 카드 |
|---|---|---|
| TS-001 기록 수정 요청 팀 인수 | ready | [TS-001](tasks/TS-001-corrections.md) |
| TS-002 근무 달력 | review | [TS-002](tasks/TS-002-calendar.md) |
| TS-003 디자인 컴포넌트 가이드 | review | [TS-003](tasks/TS-003-component-guide.md) |
| TS-004 멤버 오늘 근무 대시보드 | in_progress | [TS-004](tasks/TS-004-member-today.md) |

현재 상태의 원본은 각 카드다. 완료는 구현뿐 아니라 관련 검증 증거가 있어야 한다. 실패·환경 부족·정책 질문은 구분해 기록한다.

## 연결 기준

- PRD가 정책 원본, server/src/contract.ts가 API 계약 원본이다.
- UI 규칙은 기존 timesheet-ui 스킬, 실행 증거는 docs/verify/에 둔다.
- 문서는 docs/ 아래에 만들고 docs/README.md에 링크한다. 에이전트·스킬 파일은 도구 인식을 위한 설정이다.
- 병렬 수정은 파일 소유권을 나눈 뒤 진행한다. 공유 파일은 한 담당자만 쓴다.
- 역할 권한은 지침이며 OS 수준 접근 제한은 아니다. 실제 실행 권한은 호스트가 적용한다.

## 형식 근거

- [OpenAI 공식 스킬 문서](https://learn.chatgpt.com/docs/build-skills)
- [OpenAI 공식 서브에이전트 문서](https://learn.chatgpt.com/docs/agent-configuration/subagents)
- [Claude Code 서브에이전트 문서](https://code.claude.com/docs/en/sub-agents)
