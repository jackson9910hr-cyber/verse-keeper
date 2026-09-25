# CLAUDE.md — Verse Keeper

완전 오프라인 성경 암송 iOS 앱 (Expo SDK 57 · React Native 0.86 · TypeScript strict · expo-sqlite).
설계 문서: `docs/spec.md`, `docs/screens.md`, `docs/data-model.md`, `docs/algorithms.md`, `docs/architecture.md`, `docs/app-review-risks.md`, `docs/open-questions.md`.
**동작이 스펙과 다르면 코드를 스펙에 맞춘다. 스펙을 바꿔야 하면 먼저 문서를 수정하고 그 이유를 커밋 메시지에 남긴다.**

## 명령어

| 목적 | 명령 |
|---|---|
| 의존성 설치 | `npm ci` |
| 네이티브 모듈 추가 | `npx expo install <pkg>` (npm install 대신 — SDK 호환 버전 고정) |
| 개발 서버 | `npx expo start` |
| 전체 테스트 | `npm run test` |
| 커버리지 | `npm run test -- --coverage` (domain 90% threshold) |
| 린트 | `npm run lint` |
| 타입 검사 | `npm run typecheck` |
| 한 번에 검증 | `npm run verify` (= typecheck && lint && test) |
| 버전 호환 확인 | `npx expo install --check` · `npx expo-doctor` |
| iOS 빌드 | `eas build -p ios --profile <development\|preview\|production>` |

> 스크립트 이름을 바꾸면 이 표도 같이 고친다. 출시 절차는 `docs/release.md`.

추가 규칙:
- React Compiler 계열 lint 규칙(`react-hooks/refs`, `purity`, `set-state-in-effect`)을 끄지 말고 코드를 고친다.
- RNTL v14의 `render`/`fireEvent`는 async다 — 반드시 `await`.
- 번들 팩은 `scripts/build-pack.ts`로만 만든다. 손으로 JSON을 고치지 않는다.

## 폴더 규칙

- `src/app/` — Expo Router 라우트만 둔다(SDK 57은 `src/app`이 있으면 그것을 라우트 루트로 쓴다). 화면 조립과 네비게이션만 담당하고 로직은 `src/features`로 보낸다.
- `src/domain/` — **순수 TypeScript**. `react`, `react-native`, `expo*`, `@/data`, `@/ui`, `@/platform` import 금지. `Date.now()`, 인자 없는 `new Date()`, `Math.random()` 금지 → `Clock`과 시드 RNG를 주입받는다.
- `src/data/` — SQLite를 아는 유일한 계층(repositories, services, migrations). UI(`src/app`, `src/features`, `src/ui`)는 `expo-sqlite`를 import하지 않는다.
- `src/platform/` — Expo 네이티브 모듈 래퍼(speech, notifications, haptics, share, files, clock, uuid). 테스트에서는 fake로 바꾼다.
- `src/features/<기능>/` — 화면 hook과 기능 전용 컴포넌트. 공통 컴포넌트는 `src/ui/`에 둔다.
- `src/i18n/locales/{ko,en}.json` — 모든 사용자 노출 문자열. 두 파일의 키 집합은 같아야 한다(테스트로 검사).
- 테스트 파일은 대상 옆에 `*.test.ts(x)`로 둔다.

## 코딩 규칙

- TypeScript `strict` + `noUncheckedIndexedAccess`. `any`, `@ts-ignore` 금지(`@ts-expect-error` + 사유 주석만 허용).
- 날짜: 달력 날짜는 `LocalDate`(`'YYYY-MM-DD'`)로만 다룬다. 시각은 epoch ms. 로컬 날짜 변환은 `src/domain/time`만 한다.
- EF는 정수 `efMilli`로 다룬다. 스케줄 수식은 `docs/algorithms.md` §1 표와 일치해야 한다.
- DB 쓰기가 2개 이상이면 반드시 트랜잭션으로 묶는다. 마이그레이션은 추가만 하고, 배포된 마이그레이션은 수정하지 않는다.
- 하드코딩 문자열 금지 — `t('key')`를 쓴다. 색상은 테마 토큰만 쓴다(hex 직접 사용 금지).
- 모든 터치 요소: `accessibilityRole`, `accessibilityLabel`, 최소 44×44pt.
- 새 기능은 **테스트 먼저**(Red → Green → Refactor). 버그 수정은 재현 테스트부터 작성한다.
- 에러는 삼키지 않는다. 사용자에게는 i18n 메시지를 보여 주고, 개발 빌드에서만 `console.error`로 남긴다.

## 🚫 금지사항 (위반하면 PR 거절)

1. **저작권이 있는 성경 본문** — 개역개정, 개역한글, 새번역, 공동번역, NIV, ESV, NASB, NKJV, NLT 등의 본문을 코드, 번들, 시드, 예시, 테스트 픽스처, 문서 어디에도 넣지 않는다. 번들 본문은 **WEB(공개 도메인)만** 허용한다. 테스트는 WEB 본문이나 직접 만든 더미 문장을 쓴다. KJV는 승인 전까지 넣지 않는다.
2. **WEB 원문 수정 금지** — 팩 JSON의 영어 본문은 원문 그대로 둔다(상표 조건).
3. **네트워크 호출** — `fetch`, `XMLHttpRequest`, `WebSocket`, 원격 이미지 URL, 원격 폰트 사용 금지. 앱은 비행기 모드에서도 모든 기능이 동작해야 한다.
4. **추적·분석·광고·크래시 리포팅 SDK** (Firebase Analytics, Sentry, Amplitude, AdMob 등) 추가 금지. 필요해 보이면 제안만 하고 사람의 승인을 받는다.
5. **원격 푸시** — 로컬 알림만 쓴다. push token을 요청하지 않는다.
6. **비밀값·개인 식별 정보 커밋 금지** — `.env*`, 인증서(`*.p8`, `*.p12`, `*.mobileprovision`), Apple 계정 정보, 실제 가족 이름.
7. 의존성 추가는 사유를 커밋 본문에 적는다. 네이티브 모듈은 `npx expo install`로만 추가한다.

## 커밋 규칙

- **Conventional Commits**: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `chore:`, `build:`, `ci:`, `perf:`, `style:`. 스코프 권장: `feat(srs): …`, `test(cloze): …`.
- 제목은 72자 이내, 명령형. 본문에는 무엇을 왜 바꿨는지 적는다.
- 커밋은 의미 단위로 나눈다(테스트와 구현은 같은 커밋 또는 test → feat 순서).
- 커밋 전에 `npm run verify`가 통과해야 한다(husky pre-commit: lint-staged / commit-msg: commitlint).
- 작업 브랜치에서 개발하고 main에 직접 push하지 않는다.

## Stage 진행 규칙

- 각 Stage 끝에서 멈추고 요약, 변경 파일, 테스트 결과, 다음 계획을 보고한 뒤 승인을 기다린다.
- 다음 Stage로 넘어가기 전에 test, lint, typecheck를 모두 통과시킨다.
- 버전, 정책, 모호한 요구사항은 추측하지 않는다 — 공식 문서와 npm으로 확인하거나 질문한다.
