# Verse Keeper — 화면 흐름 (screens.md)

> Stage 0 산출물 · 라우팅: Expo Router (파일 기반)

> 💡 **웹 개발자 관점** — Expo Router는 Next.js처럼 `app/` 폴더의 파일 경로가 곧 URL(라우트)이 된다. `(tabs)` 같은 괄호 폴더는 URL에 나타나지 않는 "그룹"이고, `_layout.tsx`는 그 폴더의 공통 레이아웃(탭 바나 스택 헤더)이다. 브라우저 history 대신 네이티브 **스택**(push/pop 애니메이션)과 **탭**을 쓴다.

## 1. 라우트 맵

```text
app/
├─ _layout.tsx                 # Providers(DB, i18n, Theme, Profile) + 스플래시 제어 + 마이그레이션 게이트
├─ onboarding.tsx              # 첫 실행 (이름 입력)
├─ (tabs)/
│  ├─ _layout.tsx              # 탭 바: 홈 · 구절 · 가족 · 설정
│  ├─ index.tsx                # 홈
│  ├─ verses/index.tsx         # 구절 목록
│  ├─ family.tsx               # 가족
│  └─ settings/index.tsx       # 설정
├─ verse/[id].tsx              # 구절 상세
├─ verse/edit.tsx              # 추가 / 편집 (?id=)  — modal
├─ practice/[cardId].tsx       # 암송 (모드 탭: 빈칸 · 첫 글자 · 듣기) + 평가
├─ review/session.tsx          # 오늘 복습 세션 (practice 컴포넌트 재사용)
├─ review/summary.tsx          # 세션 결과
├─ family/pick.tsx             # 이번 주 구절 선택 — modal
├─ settings/profiles.tsx       # 가족 구성원 관리
├─ settings/notifications.tsx
├─ settings/backup.tsx
├─ settings/appearance.tsx     # 테마 · 언어 · 햅틱
├─ settings/study.tsx          # 세션 크기 · 빈칸 옵션 · 한국어 힌트 규칙 · 듣기 기본값
├─ settings/about.tsx          # 버전 · 번역 출처 · 오픈소스 라이선스 · 개인정보처리방침
└─ +not-found.tsx
```

## 2. 화면 흐름도

```mermaid
flowchart TD
    Launch([앱 실행]) --> Gate{마이그레이션}
    Gate -- 실패 / DB가 더 최신 --> DbErr[DB 오류 화면<br/>백업 내보내기 시도 · 문의 안내]
    Gate -- OK --> Onb{onboarding.done?}
    Onb -- 아니오 --> OB[온보딩<br/>이름 입력 · 팩 설치] --> Home
    Onb -- 예 --> Home

    subgraph Tabs[탭]
      Home[홈<br/>프로필 칩 · 오늘 복습 배지 · streak · 이번 주 가족 구절]
      List[구절 목록<br/>검색 · 태그/팩 필터 · 정렬]
      Fam[가족<br/>이번 주 구절 · 구성원 체크 · 지난 구절]
      Set[설정]
    end

    Home -- 복습 시작 --> RS[복습 세션] --> Pr
    Home -- 가족 구절 탭 --> VD
    Home -- 빈 상태: 새 구절 학습 --> List
    List -- + --> VE[구절 추가/편집 modal]
    List -- 항목 --> VD[구절 상세<br/>ko/en 카드 상태 · 학습 시작 · 연습]
    VD -- 편집 --> VE
    VD -- 연습 / 학습 시작 --> Pr[암송 화면<br/>빈칸 | 첫 글자 | 듣기]
    Pr -- 정답 보기 --> Grade[평가 4버튼<br/>+ 다음 간격 미리보기]
    Grade -- 세션 중 --> RS
    Grade -- 단일 연습 --> VD
    RS -- 큐 소진 --> Sum[세션 결과]
    Sum --> Home
    Fam -- 이번 주 구절 정하기 --> Pick[구절 선택 modal] --> Fam
    Set --> Prof[가족 구성원] & Noti[알림] & Bk[백업] & App[화면·언어] & Study[학습 설정] & About[정보]
    Bk -- 내보내기 --> Share[[iOS 공유 시트]]
    Bk -- 가져오기 --> Doc[[문서 선택기]] --> Val{검증} -- OK --> Confirm[미리보기 + 덮어쓰기 확인] --> Home
    Val -- 실패 --> BkErr[오류 메시지]
    Noti -- 첫 ON --> Perm[[iOS 권한 요청]]
```

## 3. 화면별 상태

공통 규칙
- **로딩**: 200ms 안에 끝나면 아무것도 표시하지 않는다(깜빡임 방지). 그보다 오래 걸리면 스켈레톤을 보여 준다. 모든 데이터는 로컬이므로 긴 로딩은 예외적인 상황이다.
- **오류**: `ErrorState` 컴포넌트(아이콘 + 원인 문장 + "다시 시도" 버튼)를 쓴다. 기술적인 스택 트레이스는 사용자에게 보여 주지 않고, 개발 빌드에서만 콘솔에 남긴다.
- 모든 문자열은 i18n 키를 쓰고, 모든 버튼에 `accessibilityLabel`/`accessibilityRole`을 단다.

| 화면 | 정상 | 빈 상태 | 로딩 | 오류 / 예외 |
|---|---|---|---|---|
| 온보딩 | 이름 입력(선택) + 시작 | — | 팩 설치 중 버튼 스피너 | 팩 설치 실패 → 재시도(트랜잭션 롤백 뒤) |
| 홈 | 배지 N, streak, 가족 구절 카드, "복습 시작" | 배지 0 → "오늘 복습 완료" + "새 구절 학습"; 학습 카드 0장 → "첫 구절을 골라 보세요" | 스켈레톤 | 쿼리 실패 → ErrorState |
| 구절 목록 | FlatList(성경 순 / 최근 추가순) | 검색 결과 0 → "‘q’와 일치하는 구절이 없어요"; 사용자 구절 0 + 필터 "내 구절" → "구절 추가" CTA | 스켈레톤 3줄 | ErrorState |
| 구절 상세 | 참조, 본문(ko/en 탭), 태그, 카드 상태(다음 복습일, 레벨) | 해당 언어 본문 없음 → 그 언어 탭 숨김 | — | 삭제된 구절 딥링크 → not-found |
| 추가/편집 | 폼 | — | 저장 중 버튼 비활성화 | 필드별 인라인 검증 오류, 저장하지 않고 닫으려 하면 확인 알림 |
| 암송 | 모드 탭, 토큰 렌더, 정답 보기 | 선택한 언어 본문 없음 → 다른 언어 안내 | — | TTS 음성 없음 → 안내 배너(듣기 모드만 비활성화) |
| 복습 세션 | 진행률(3/20), 카드 | 큐 0 → summary로 바로 이동 | — | 저장 실패 → 토스트 + 같은 카드 유지(재시도) |
| 세션 결과 | 평가 분포, streak 변화 | — | — | — |
| 가족 | 이번 주 구절 + 구성원 체크 칩 + 지난 구절 | 이번 주 미지정 → "이번 주 구절 정하기" CTA; 구성원 1명 → "구성원 추가" 안내 | 스켈레톤 | ErrorState |
| 구성원 관리 | 목록, 추가, 이름 수정, 색상, 순서 | — | — | 9번째 추가 → 비활성화 + 안내, 마지막 1명 삭제 불가 |
| 알림 | 토글 + 시간 선택기 | — | 권한 요청 중 | 권한 거부 → 토글 OFF + "설정 열기" 버튼 |
| 백업 | 내보내기 / 가져오기 버튼, 마지막 내보내기 시각 | — | 파일 생성·검증 중 모달 스피너 | 검증 오류 코드별 메시지, 공유 취소는 오류로 보지 않음 |
| DB 오류 | "데이터를 여는 중 문제가 생겼어요" + 가능하면 백업 내보내기 | — | — | 앱 재설치를 권하지 않는다(데이터 손실) |

## 4. 주요 컴포넌트 (`src/ui`)

| 컴포넌트 | 역할 |
|---|---|
| `Screen` | SafeArea + 스크롤 + 배경 테마 |
| `Text` | Dynamic Type을 지원하는 타이포그래피 토큰(`title`, `body`, `verse` …) |
| `Button`, `IconButton` | 최소 44×44pt, 햅틱 옵션, a11y 필수 prop |
| `Chip`, `Badge`, `Card`, `ListItem` | |
| `EmptyState`, `ErrorState`, `Skeleton` | 상태 표준화 |
| `VerseTokens` | 토큰 배열 렌더(빈칸/힌트/하이라이트). 빈칸 탭 → 공개. `Text` 중첩으로 줄바꿈 보존 |
| `GradeBar` | 4버튼 + 다음 간격 미리보기 |
| `ReferencePicker` | 책(66권, 구약/신약 섹션, 검색) → 장 → 절 범위 |
