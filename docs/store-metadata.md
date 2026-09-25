# Verse Keeper — App Store 메타데이터 초안

> 글자 수 제한: 이름 30 · 부제 30 · 키워드 100(쉼표 구분, 공백 없이) · 프로모션 텍스트 170 · 설명 4,000.
> 앱 이름은 [open-questions.md](./open-questions.md) Q4 확정 뒤 바꾼다("Bible Verse Keeper"가 이미 있음).

## 한국어 (기본 언어)

| 항목 | 내용 | 글자 수 |
|---|---|---|
| 이름 | Verse Keeper: 성경 암송 | 20 |
| 부제 | 매일 몇 분, 말씀을 마음에 새기기 | 19 |
| 키워드 | 성경암송,말씀,암송,큐티,묵상,성경,가정예배,주일학교,간격반복,플래시카드,기독교,교회 | 55 |
| 프로모션 텍스트 | 계정도 광고도 없는 완전 오프라인 암송 앱. 이번 주 가족 구절을 함께 외워 보세요. | 45 |

**설명**
```
Verse Keeper는 말씀 암송을 돕는 완전 오프라인 앱입니다. 계정, 광고, 추적이 없고 모든 데이터는 내 기기에만 저장됩니다.

■ 잊어버릴 때쯤 다시 — 간격 반복
검증된 SM-2 방식으로 오늘 복습할 구절만 골라 드려요. 버튼 네 개(다시/어려움/좋음/쉬움)로 평가하면 다음 복습일이 자동으로 정해집니다.

■ 세 가지 암송 모드
• 빈칸 채우기: 5단계 레벨로 빈칸이 점점 늘어나요. 중요한 단어부터 가릴 수 있어요.
• 첫 글자 힌트: 영어는 첫 알파벳, 한국어는 첫 음절이나 초성으로 힌트를 줘요.
• 듣기: 기기 음성으로 읽어 주고, 읽는 단어를 강조해 보여 줘요. 속도와 구 반복을 조절할 수 있어요.

■ 가족이 함께
한 기기에서 가족 구성원별로 진도를 따로 관리하고, 이번 주 가족 구절을 정해 함께 외울 수 있어요.

■ 내 구절, 내 번역
한국어·영어 본문을 직접 입력하고 태그로 정리하세요. 기본 구절 50개(World English Bible, 공개 도메인)가 들어 있어요.

■ 그 밖에
매일 복습 알림(선택), 연속 학습일 기록, 다크 모드, 한국어/영어 화면, 백업 파일 내보내기·가져오기.

※ 저작권 때문에 한국어 성경 번역본은 포함되어 있지 않습니다. 한국어 본문은 직접 입력해 주세요.
```

## English

| Item | Text | Length |
|---|---|---|
| Name | Verse Keeper: Bible Memory | 26 |
| Subtitle | Hide God’s word in your heart | 29 |
| Keywords | scripture,memorize,memory,bible,verse,flashcards,spaced,repetition,family,devotion,church | 90 |
| Promotional text | A fully offline Scripture memory app — no account, no ads, no tracking. Learn this week’s family verse together. | 112 |

**Description**
```
Verse Keeper helps you memorize Scripture — completely offline. No account, no ads, no tracking. Everything stays on your device.

■ Spaced repetition
A proven SM-2 schedule shows you only the verses due today. Grade yourself with four buttons (Again / Hard / Good / Easy) and the next review is planned for you.

■ Three ways to practice
• Cloze: five levels of blanks, optionally hiding key words first.
• First letter: see just the first letter of each word (Korean: first syllable or initial consonants).
• Listen: text-to-speech with word highlighting, adjustable speed and phrase repeats.

■ Made for families
Separate progress for each family member on one device, plus a shared verse of the week.

■ Your verses, your way
Add Korean and English text and organize with tags. Includes 50 starter verses from the World English Bible (public domain).

■ Also
Optional daily reminder, study streaks, dark mode, Korean/English UI, backup export and import.
```

## 스크린샷 규격 (필수)

| 기기 | 해상도(세로) | 수량 | 비고 |
|---|---|---|---|
| iPhone 6.9" | 1320×2868 또는 1290×2796 | 3~10 | 필수. 다른 iPhone 크기는 자동 축소 |
| iPad 13" | 2064×2752 또는 2048×2732 | 3~10 | `supportsTablet: true`이므로 필수 |

권장 장면(ko/en 각각): ① 홈(오늘 복습 배지·연속일) ② 빈칸 모드 ③ 첫 글자 모드(한국어 초성) ④ 듣기 모드 하이라이트 ⑤ 가족 탭 ⑥ 다크 모드.
Mac이 없으면 TestFlight로 설치한 iPhone/iPad에서 캡처한다(iPhone 16/17 Pro Max = 6.9", iPad Pro 13").

## 앱 정보

| 항목 | 값 |
|---|---|
| 카테고리 | 교육(주) / 참고(보조) — Kids 카테고리 선택 안 함 |
| 연령 등급 | 4+ (설문 모두 "없음") |
| 가격 | 무료, 인앱 결제 없음 |
| 앱 개인정보 보호 | 데이터 수집 안 함 |
| 저작권 표기 | © 2026 <개발자 이름> |
| 개인정보처리방침 URL | `https://<github-id>.github.io/verse-keeper-site/privacy-policy` |
| 지원 URL | `https://<github-id>.github.io/verse-keeper-site/support` |

## Review Notes (심사 노트)

```
Verse Keeper is a fully offline Scripture memorization app. No account, no login, no server,
no analytics, no ads. All data is stored locally on the device (SQLite).

How to test:
1. Enter any name (optional) and tap "Get started".
2. Verses tab → John 3:16 → "Start learning".
3. Home → "Start review" → switch between Cloze / First letter / Listen → "Show answer" → grade.
4. Family tab → "Choose this week's verse". Settings → Family members to add a second member.

The bundled English text is the World English Bible (public domain, unmodified). No copyrighted
translation is included; Korean text is entered by the user. User-entered content never leaves
the device and is not visible to other users. Notifications are optional local reminders (off
by default; permission is requested only when the user turns them on). Export compliance:
the app uses no encryption (ITSAppUsesNonExemptEncryption = NO).
```
