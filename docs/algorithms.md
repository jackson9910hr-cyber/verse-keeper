# Verse Keeper — 알고리즘 명세 (algorithms.md)

> Stage 0 산출물 · 여기 나오는 모든 함수는 `src/domain`의 **순수 함수**다(React/Expo/SQLite 의존 없음).
> 이 문서의 표와 테스트 벡터는 Stage 1 단위 테스트에 그대로 옮긴다.

## 0. 공통 원시 타입

```ts
type LocalDate = string;            // 'YYYY-MM-DD', 기기 로컬 달력 날짜 (타임존 정보 없음)
type EpochMs = number;

interface Clock {
  now(): EpochMs;                            // 실제 구현: Date.now()  (src/data 또는 app 계층에만 존재)
  tzOffsetMinutes(at: EpochMs): number;      // 실제 구현: -new Date(at).getTimezoneOffset()
}
```

- **`Date.now()`나 `new Date()`를 domain 안에서 직접 호출하지 않는다.** 오늘 날짜는 `toLocalDate(clock.now(), clock.tzOffsetMinutes(clock.now()))`로만 구한다.
- `LocalDate` 연산(`addDays`, `diffDays`, `dayOfWeek`)은 **civil-from-days 정수 알고리즘**(Howard Hinnant)으로 구현한다. JS `Date`의 로컬 타임존 동작에 기대지 않으므로 DST와 무관하다.
- 테스트용 `FixedClock`과 `TableClock`(시각 구간별 오프셋 표 — 예: America/New_York 2026-03-08 02:00 EST→EDT)을 제공한다.

```text
toLocalDate(ms, offsetMin) = civilFromDays( floor((ms + offsetMin·60_000) / 86_400_000) )
```

---

## 1. 간격 반복: SM-2 변형

### 1.1 상태

```ts
interface ReviewState {
  efMilli: number;        // Easiness Factor × 1000 (정수). 초기값 2500, 하한 1300
  reps: number;           // 연속 성공 횟수 (실패하면 0)
  intervalDays: number;   // 마지막으로 정한 간격(일). 새 카드는 0
  dueDate: LocalDate;     // 다음 복습일
  lapses: number;         // 누적 실패 횟수
  lastReviewedOn: LocalDate | null;
}
type Grade = 'again' | 'hard' | 'good' | 'easy';
schedule(state: ReviewState, grade: Grade, today: LocalDate): ReviewState   // 순수 함수
```

> **EF를 정수(×1000)로 저장하는 이유** — 부동소수점 누적 오차(예: `2.5 - 0.14 - 0.14 …`) 때문에 테스트 벡터가 플랫폼마다 달라지는 문제를 없앤다.

### 1.2 등급 → SM-2 품질 점수(q)

| 버튼 | Grade | q | ΔEF = 0.1 − (5−q)(0.08 + (5−q)·0.02) | ΔefMilli |
|---|---|---|---|---|
| 다시 | again | 2 | 0.1 − 3·0.14 = **−0.32** | −320 |
| 어려움 | hard | 3 | 0.1 − 2·0.12 = **−0.14** | −140 |
| 좋음 | good | 4 | 0.1 − 1·0.10 = **0.00** | 0 |
| 쉬움 | easy | 5 | **+0.10** | +100 |

$$EF' = \max\left(1.3,\ EF + 0.1 - (5-q)\,(0.08 + (5-q)\cdot 0.02)\right)$$

EF는 **모든 등급에서** 위 식으로 갱신하고(원래 SM-2와 같음), 상한은 두지 않는다(간격 상한으로 충분히 제한됨).

### 1.3 간격 규칙

`n' = 갱신 후 reps`, `I = state.intervalDays`, `E = efMilli'`(갱신된 EF). `round`는 0.5에서 올림(`Math.round`)이다.

**실패 (again)**
```text
reps' = 0,  lapses' = lapses + 1,  I' = 1
```
그리고 세션 안에서는 같은 세션 끝에 한 번 더 나온다(세션 큐 규칙, DB 상태와는 별개).

**성공 (hard / good / easy)** — `n' = reps + 1`

| n' | hard | good | easy |
|---|---|---|---|
| 1 (첫 성공) | 1 | 1 | 3 |
| 2 | 3 | 6 | 8 |
| ≥ 3 | `max(I+1, round(I·12/10))` | `round(I·E/1000)` | `round(I·E·13/10_000)` |

**보정(적용 순서 고정)**
1. `good = max(good, hard)`
2. `easy = max(easy, good + 1)`
3. 모든 값은 `clamp(1, MAX_INTERVAL = 365)`

```text
dueDate' = addDays(today, I'),  lastReviewedOn' = today
```

### 1.4 기한 전·기한 후 복습

| 상황 | 처리 |
|---|---|
| 기한 지남 (`dueDate < today`) | 원래 SM-2처럼 지연 보너스 없이 위 식을 그대로 적용한다(`I`는 저장된 간격) |
| 기한 전 (`dueDate > today`)에 상세 화면에서 "연습" | **스케줄을 바꾸지 않는다.** 로그에 `kind='practice'`로 기록하고 streak에는 포함한다 |
| 같은 날 같은 카드 두 번째 평가(세션 내 again → 재학습) | 스케줄 갱신을 허용한다(again 뒤 good ⇒ n'=1, I'=1) |

### 1.5 새 카드

```text
initialState(today) = { efMilli: 2500, reps: 0, intervalDays: 0, dueDate: today, lapses: 0, lastReviewedOn: null }
```

### 1.6 테스트 벡터 (Stage 1에서 그대로 사용)

| # | 이전 (ef, reps, I) | grade | 이후 (ef, reps, I, lapses+) |
|---|---|---|---|
| T1 | 2500, 0, 0 | good | 2500, 1, 1 |
| T2 | 2500, 1, 1 | good | 2500, 2, 6 |
| T3 | 2500, 2, 6 | good | 2500, 3, 15 |
| T4 | 2500, 3, 15 | good | 2500, 4, 38 (37.5 → 38) |
| T5 | 2500, 0, 0 | easy | 2600, 1, 3 |
| T6 | 2500, 0, 0 | hard | 2360, 1, 1 |
| T7 | 2500, 0, 0 | again | 2180, 0, 1, +1 |
| T8 | 1400, 5, 40 | again | **1300** (하한), 0, 1, +1 |
| T9 | 1300, 3, 3 | hard | 1300, 4, 4 (`max(4, round(3.6)=4)`) |
| T10 | 1300, 3, 3 | good | 1300, 4, 4 (`round(3.9)=4`, 보정1 → max(4,4)) |
| T11 | 1300, 3, 3 | easy | 1400, 4, **5** (`round(3·1400·13/10000) = round(5.46) = 5`, 보정2: `max(5, good 4 + 1) = 5`) |
| T12 | 2500, 5, 200 | good | 2500, 6, **365** (500 → 상한) |
| T13 | 2500, 2, 6 | hard | 2360, 3, **7** (`max(6+1, round(7.2)=7)`) |
| T14 | 2500, 1, 1 | easy | 2600, 2, **8** |
| T15 | 2500, 1, 1 | again | 2180, 0, 1, +1 |

### 1.7 복습 큐

```text
due(profile, today) = cards where profile_id = p AND suspended = 0 AND due_date <= today
order by due_date ASC, lapses DESC, verse_id ASC, lang ASC
limit sessionSize (기본 20)
```

---

## 2. 토큰화

### 2.1 정규화
1. `text.normalize('NFC')` (iOS 입력기가 한글 자모를 분리된 형태(NFD)로 넣는 경우 대비)
2. 줄바꿈과 탭은 공백 1칸으로 바꾸고, 연속 공백은 1칸으로 줄인다. 앞뒤 공백은 제거한다.

### 2.2 토큰 종류
```ts
type Token =
  | { kind: 'word';  text: string; start: number; index: number; script: 'hangul' | 'latin' | 'digit' | 'other' }
  | { kind: 'punct'; text: string; start: number }
  | { kind: 'space'; text: string; start: number };
```

### 2.3 단어 규칙 (정규식, `u` 플래그)
```text
SEG     = [\p{L}\p{M}\p{N}]+
WORD    = SEG ( (['’\-] SEG) | (?<=\p{N})[.,:](?=\p{N}) \p{N}+ )*
PUNCT   = 그 밖의 공백이 아닌 문자 1개씩
```

| 입력 | 단어 토큰 |
|---|---|
| `God's` / `God’s` | 1개 (아포스트로피 포함) |
| `well-pleasing` | 1개 |
| `3,000` / `3:16` | 1개 (숫자 사이 구분자) |
| `love,the` | `love` · `,` · `the` (문자 사이 쉼표는 구두점) |
| `"Jesus` | `"` · `Jesus` |
| `—` / `...` | 구두점만 |
| `우리는` · `오늘도` | 어절 1개씩 |
| `예수 Christ께서` | `예수` · `Christ께서` (문자가 섞인 어절은 한 단어; script는 첫 글자 기준) |

- **Hermes 호환성**: Hermes는 `\p{…}`와 lookbehind를 지원한다(Stage 1에서 기기 스모크 테스트로 확인). 지원하지 않는 것으로 드러나면 명시적 유니코드 범위 테이블로 바꾼다 — 테스트는 그대로 둔다.
- 한국어는 형태소 분석을 하지 않는다(외부 사전 금지 → 번들 크기와 라이선스). **어절 = 단어**로 본다.

---

## 3. 빈칸 채우기 생성기

```ts
generateCloze(text: string, opts: {
  level: 1 | 2 | 3 | 4 | 5;       // LEVEL_PCT = [20, 40, 60, 80, 100]
  seed: string;                    // `${cardId}|${sessionSeed}` — level은 넣지 않는다(§3.3)
  contentFirst: boolean;
  lang: 'ko' | 'en';
}): { tokens: Token[]; hidden: Set<number> /* word index */ }
```

### 3.1 개수
```text
W = 단어 토큰 수
n = W == 0 ? 0 : max(1, ceil(LEVEL_PCT[level] · W / 100))     // 정수 연산 (0.6·5 = 3.0000000000000004 문제 방지)
```

### 3.2 난수
- `hash = FNV-1a 32bit(seed)` → `rng = mulberry32(hash)` (Math.random 사용 금지)
- 단어 인덱스 배열에 Fisher–Yates 셔플을 적용한다.

### 3.3 레벨 간 포함 관계 (핵심 성질)
**순서는 레벨과 관계없이 정하고, 레벨은 앞에서 몇 개를 가릴지만 정한다.**
⇒ 같은 seed에서 `hidden(L) ⊆ hidden(L+1)`가 성립한다. 레벨을 올려도 이미 가린 단어가 다시 드러나지 않으므로 학습 경험이 자연스럽다. (속성 테스트로 검증)

### 3.4 내용어 우선
`contentFirst = true`이면 셔플 결과를 **안정 분할**한다: `[내용어(셔플 순서 유지)…, 기능어(셔플 순서 유지)…]`.

| 언어 | 기능어 판정 |
|---|---|
| en | 소문자 기준 불용어 목록(약 70개): a, an, the, and, or, but, of, to, in, on, at, by, for, with, from, as, is, are, was, were, be, been, it, its, that, this, these, those, he, she, they, we, you, i, me, him, her, them, us, my, your, his, our, their, not, no, so, if, then, than, which, who, whom, what, when, where, shall, will, has, have, had, do, does, did, all, also, into, unto, upon … (확정 목록은 `src/domain/text/stopwords.en.ts`) |
| ko | (a) 한글 1음절 어절, 또는 (b) 접속·지시어 목록: 그, 이, 저, 또, 및, 곧, 그리고, 그러나, 그러므로, 그런즉, 이는, 이것은, 그것은, 그가, 내가, 너희가, 우리가, 오직, 또한, 이제 … (`stopwords.ko.ts`) |
| 숫자 | 내용어 |

### 3.5 표시와 정답 비교
- 가린 단어는 `＿` 블록으로 보여 준다. 폭은 설정에 따라 원래 글자 수 또는 고정 3칸.
- 구두점과 공백 토큰은 항상 그대로 보인다.
- "입력해서 맞히기" 비교 `normalizeAnswer(s)`: NFC → 소문자 → `’`를 `'`로 → 앞뒤 구두점 제거 → trim. 한국어는 이 정규화 뒤 **완전 일치**만 정답으로 본다(조사 차이도 오답 — 정확한 암송이 목적).

---

## 4. 첫 글자 힌트

```ts
firstLetterHint(text, { lang, koRule: 'syllable' | 'choseong', showLength: boolean }): HintToken[]
```

| script | 규칙 | 예 |
|---|---|---|
| latin | 첫 글자 + (showLength ? `_`×(len−1) : `…`) | `loved` → `l____` |
| digit | 첫 숫자 + 같은 규칙 | `3,000` → `3____` |
| hangul · `syllable` (기본 제안) | 첫 음절 + 나머지 음절 수만큼 `○` | `우리는` → `우○○` |
| hangul · `choseong` | 어절의 모든 음절을 초성으로 | `우리는` → `ㅇㄹㄴ` |
| 섞인 어절 | 첫 글자 script 규칙을 적용 | `Christ께서` → `C_____…` |

초성 추출: 음절 `c ∈ [U+AC00, U+D7A3]`이면 `CHO[floor((c − 0xAC00) / 588)]`, `CHO = ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ`. 호환 자모(ㄱ 등 단독 자모)는 그대로 둔다.

---

## 5. 듣기 모드: 구 분할과 하이라이트

### 5.1 구 분할
- 구 경계 구두점: `, ; : . ! ? … — ·` 그리고 `，。、`. 구두점은 앞 구에 붙인다.
- 한 구가 12단어를 넘으면 12단어마다 공백 위치에서 강제로 나눈다.
- 결과: `Phrase { text, startOffset, tokenRange }[]`.

### 5.2 재생 계획 (순수 함수)
```text
playbackPlan(phrases, repeat N) = [p0 ×N, p1 ×N, …]    // 각 항목: { phraseIndex, iteration }
```
재생기(`src/features/listen/usePlayer.ts`)는 계획을 차례로 `Speech.speak(phrase.text, { language, rate, onBoundary, onDone })` 한다.

### 5.3 하이라이트 매핑
- `onBoundary({ charIndex })` → `globalIndex = phrase.startOffset + charIndex` → 토큰 `start` 배열에서 이진 탐색해 단어 index를 찾는다(순수 함수 `tokenAtOffset`).
- boundary 이벤트가 오지 않으면(음성·OS에 따라) 구 전체를 하이라이트한다.
- 속도 매핑: UI 0.5×~1.5× → `rate` 값 그대로 전달. iOS 실제 체감 속도 보정은 Stage 2 실기기 확인 뒤 필요하면 조정한다(`RATE_MAP` 상수).

---

## 6. Streak

```ts
computeStreak(studyDays: LocalDate[] /* 중복 가능, 정렬 안 됨 */, today: LocalDate): { current: number; longest: number; studiedToday: boolean }
```

1. `S = distinct(studyDays)` — 로그의 `local_date` 중 `kind ∈ {review, practice}`.
2. `anchor = today ∈ S ? today : (addDays(today,-1) ∈ S ? addDays(today,-1) : null)`
3. `current = anchor == null ? 0 : anchor부터 하루씩 거꾸로 S에 연속해서 있는 날 수`
4. `longest = S를 정렬했을 때 가장 긴 연속 구간 길이` (`current ≤ longest` 보장)
5. **미래 날짜**(시계를 되돌려서 `local_date > today`인 로그)는 계산에서 제외한다.

- 로그를 쓸 때 그 시점의 로컬 날짜를 `local_date`로 **저장**한다. 나중에 타임존이 바뀌어도 과거 기록을 다시 해석하지 않는다.
- 타임존 이동의 부작용(동쪽으로 이동하면 하루가 짧아짐 등)은 받아들이고 문서화한다. 빈 날이 생겨도 streak 보정은 하지 않는다.
- streak 동결(freeze) 기능은 비범위다.

---

## 7. 주간 가족 구절

```ts
weekStart(date: LocalDate, weekStartsOn: 0..6 /* 0 = 일요일, 기본 1 = 월요일 */): LocalDate
  = addDays(date, -((dayOfWeek(date) - weekStartsOn + 7) % 7))
currentFamilyVerse(assignments: {weekStart, verseId}[], today, weekStartsOn) → verseId | null
```

- 저장 키는 **주 시작 날짜**(`week_start`)다. 설정을 바꾸면 새 설정으로 계산한 키로 조회하므로, 바꾸기 전에 지정한 구절은 키가 달라져 "이번 주"로 보이지 않을 수 있다. 이 경우 **설정 변경 시점에 이번 주 지정이 비어 있고, 이전 설정으로 계산한 이번 주 지정이 있으면 그 구절을 새 키로 복사**한다(repository 계층 처리, 테스트로 검증).

---

## 8. 백업 검증

```ts
validateBackup(json: unknown, currentSchema: number): Result<BackupV, BackupError>
```
검증 순서: 크기 ≤ 5MB → `JSON.parse` → `app === 'verse-keeper'` → `schemaVersion`은 정수이고 1 ≤ v ≤ currentSchema → 필요하면 `migrateBackup(v → current)` → 필드 타입 검사(수동 타입 가드, 외부 스키마 라이브러리 없음 — 번들 최소화) → 참조 무결성(verse_id / profile_id 존재) → 문자열 길이 제한.

오류 코드: `TOO_LARGE | NOT_JSON | WRONG_APP | FUTURE_SCHEMA | INVALID_FIELD(path) | BROKEN_REFERENCE(path)`.

---

## 9. 경계 사례 목록 (Stage 1 테스트 체크리스트)

| 영역 | 사례 |
|---|---|
| 토큰화 | 빈 문자열, 공백만, 구두점만(`"…!"`), 1단어, 아포스트로피 두 종류, 하이픈, 숫자 구분자 `3:16`·`3,000`, 이모지, NFD 한글 입력, 한영 혼합 어절, 연속 공백·줄바꿈 |
| 빈칸 | W=0 → 0개, W=1 → 레벨 1에서도 1개, 레벨 5 = 전부, 정수 반올림(W=5, 60% → 3), 같은 seed → 같은 결과, 레벨 포함 관계, 내용어 우선(기능어만 있는 문장), 구두점 보존 |
| 첫 글자 | 1글자 단어(`a` → `a`), 숫자, 한글 syllable·choseong, 호환 자모, 섞인 어절 |
| SM-2 | T1~T15, 연속 실패 5회(EF 1300 유지), EF 하한, 간격 상한 365, 기한 지난 복습, 같은 날 again→good |
| 날짜 | 자정 직전(23:59:59.999)과 직후(00:00), KST(+540 고정), New York DST 시작일(23시간인 날)·종료일(25시간인 날), 타임존 변경, 윤년 2028-02-28 +1 = 02-29, 2027-02-28 +1 = 03-01, 연말 12-31 +1 |
| streak | 로그 없음, 오늘만, 어제까지(오늘 미학습) 유지, 그저께까지 → 0, 중복 날짜, 미래 날짜 무시, longest ≥ current |
| 주간 | 오늘이 시작 요일, 시작 요일 전날, 일요일 시작 설정, 연도를 넘는 주, 설정 변경 시 복사 |
| 백업 | 5MB 초과, JSON 아님, 다른 앱, 미래 스키마, 필드 누락, 깨진 참조, v1 → vN 마이그레이션 |
| 마이그레이션 | 빈 DB(v0) → 최신, 중간 버전부터, 실패 시 롤백·버전 유지, 같은 러너 두 번 실행(멱등) |
