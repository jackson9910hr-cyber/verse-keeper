# Stage 3 — 서브에이전트 병렬 리뷰 결과 (통합)

> 2026-09-25 · 리뷰어 정의: `.claude/agents/{a11y-reviewer,perf-reviewer,review-guideline-auditor}.md` · 세 에이전트를 병렬(read-only)로 실행
> 수정 후 검증: `npm run verify` 통과(테스트 230개, domain 커버리지 98.2% / 분기 91.7%), `expo prebuild`·`expo export --platform ios` 통과

## 통합 표 (심각도순)

| ID | 심각도 | 출처 | 내용 | 조치 | 상태 |
|---|---|---|---|---|---|
| A-H1 | **High** | a11y | iOS VoiceOver가 정답/오답 피드백과 폼 검증 오류를 읽지 않음(`accessibilityLiveRegion`은 Android 전용) | `src/ui/announce.ts`(`announceForAccessibility`) 추가, Cloze 피드백·VerseForm 오류에 적용 | ✅ 수정 |
| A-M1 | Med | a11y | ErrorState, 온보딩 오류, 백업 결과, 학습 추가 알림, 음성 오류가 음성으로 안내되지 않음 | 같은 helper 적용 | ✅ |
| A-M2 | Med | a11y | 복습에서 다음 카드로 넘어갈 때 VoiceOver 포커스를 잃음 | 진행률 + 다음 구절 참조를 안내 | ✅ |
| A-M3 | Med | a11y | 스테퍼(+/−) 값 변경이 안내되지 않음 | 행 전체를 `adjustable` 요소로(위/아래로 쓸기, `accessibilityValue`) | ✅ |
| A-M4 | Med | a11y | 빈칸 높이 30pt < 44pt | `hitSlop`으로 46pt 확보 | ✅ |
| A-M5 | Med | a11y | Segmented 항목 40pt | 44pt | ✅ |
| A-M6 | Med | a11y | 빈칸 상자 비텍스트 대비 1.35:1 | `textMuted` 테두리(≥ 6.4:1) | ✅ |
| A-M7 | Med | a11y | 입력 칸 테두리 대비 1.40~1.87:1 | `inputBorder` 토큰(≥ 3.3:1) | ✅ |
| G-F1 | Med | guideline | "모든 데이터 삭제"·백업 가져오기 뒤에도 iOS 알림이 계속 울림 | 재현 테스트 작성 → `resetAllData`/`importBackup`이 `cancelReminders`를 먼저 호출 | ✅ (테스트 2개) |
| G-F2 | Med | guideline | 개인정보처리방침·지원 연락처가 자리표시 | **사용자 입력 필요** — `docs/release.md` §7 | ⏳ 사용자 |
| P1 | Med | perf | 쓰기 한 번에 마운트된 모든 화면의 쿼리가 다시 실행됨 | `useLive(fetcher, deps, topics)`로 관련 주제만 구독 | ✅ |
| P2 | Med | perf | 가족 탭이 구절 전체를 읽음 | `listAssignedVerses`(JOIN) — 10.3ms → 0.23ms(2,000구절 기준) | ✅ |
| P3 | Med | perf | 설정 변경 시 context가 두 번 갱신됨 | `setSetting`은 emit 없이 저장, reload는 값이 같으면 identity 유지, 활성 프로필은 settings에서 파생 | ✅ |
| P4 | Med | perf | refetch 때마다 목록 행 전체가 다시 렌더링됨 | 구절 객체 structural sharing + learning Set 메모 | ✅ |
| P5 | Med | perf | 백업 복원 시 구절마다 태그 정리 쿼리(18k statements) | 태그 정리를 마지막에 1회 | ✅ |
| P6~P10 | Low | perf | 팩 설치 per-row 정리, family-pick 인라인 콜백, `ListEmptyComponent` 재마운트, 입력 중 전체 구절 재렌더링, 무제한 기록 목록 | 정리 1회, 콜백·Separator 안정화, 요소 전달, `TypeAnswer` 분리, 12개 + 더 보기 | ✅ |
| A-L1~L12 | Low | a11y | Chip 크기, 좁은 행 줄바꿈, 모달 모션 감소, 중복 읽기, 힌트 읽기("F, 3 letters"), streak 상태, 체크 칩 라벨, 태그 라벨 현지화, 헤더 역할, 필터 라벨, 가족 구절 잘림 | 모두 반영 | ✅ |
| G-F3 | Low | guideline | expo-notifications의 비활성 push-token 코드가 번들에 포함됨(실행되지 않음) | ESLint `no-restricted-properties`로 push-token API 호출 금지 | ✅ |
| G-F4 | Low | guideline | domain override가 추적 SDK 금지를 덮어씀, `globalThis.fetch` 미탐지 | 규칙 병합 + 전역 객체 경유 fetch 금지 | ✅ |
| G-F5 | Low | guideline | 테스트 픽스처에 한국어 성경 번역 첫 구절 조각("태초에 하나님이") | 직접 만든 더미 문장으로 교체(코드·문서·로케일) | ✅ |
| G-F6 | Low | guideline | 리스크 표 증빙이 존재하지 않는 스크립트를 가리킴 | 실제 테스트 파일로 갱신 | ✅ |
| G-F7 | Low | guideline | 자리표시 문자열 검사 없음 | `locales.test.ts`에 lorem/TODO/example.com 검사 | ✅ |
| G-F8 | Low | guideline | eas.json 미커밋 | 커밋 완료(`bc54df0`) | ✅ |

## 확인된 양호 항목 (요약)
- **대비**: 모든 텍스트 쌍 AA 통과(최저 5.28:1).
- **SQLite**: 배지·큐·streak·학습 목록·태그 쿼리 모두 인덱스/커버링 인덱스 사용(`EXPLAIN QUERY PLAN`), 모든 다중 쓰기 트랜잭션, WAL + foreign_keys.
- **번들**: iOS Hermes 번들 약 3.1MB, 앱 코드 약 223KB, 팩 JSON 17KB. 무거운 의존성 없음.
- **네이티브 설정**: entitlements 비어 있음(push 없음), Usage Description 없음, `ITSAppUsesNonExemptEncryption=false`, PrivacyInfo가 문서 §3과 일치.
- **의존성**: 운영 의존성 748개 중 분석·크래시·광고·업데이트·push SDK 없음. "데이터 수집 안 함" 라벨 타당.

## 남은 일 (사용자)
1. 개인정보처리방침·지원 페이지의 연락처와 시행일을 채워 GitHub Pages에 게시(G-F2).
2. 앱 이름(Q4)·Bundle ID(Q5) 확정.
3. Apple Developer 가입 뒤 `docs/release.md` 순서대로 빌드·제출.
