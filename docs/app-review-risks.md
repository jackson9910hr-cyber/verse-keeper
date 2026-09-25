# Verse Keeper — App Store 심사 리스크 (app-review-risks.md)

> Stage 0 산출물 · 기준: App Store Review Guidelines (2026-09 기준 공개본), App Privacy Details, Privacy Manifest 요구사항
> Stage 3의 `review-guideline-auditor`가 이 표를 기준으로 다시 점검하고, Stage 4 제출 직전에 **공식 문서로 최종 확인**한다(가이드라인 번호와 문구는 수시로 바뀜).

## 1. 가이드라인별 리스크 → 대응 → 증빙

| # | 가이드라인 | 리스크 | 가능성 | 대응 | 증빙 (어디서 확인하나) |
|---|---|---|---|---|---|
| R1 | **4.2 최소 기능** | "성경 구절 목록 앱" = 웹 콘텐츠를 모아 놓은 수준으로 판단될 위험 | 중 | 앱에서만 가능한 기능을 핵심으로 둔다: SM-2 간격 반복, 3가지 암송 모드, TTS 단어 하이라이트, 로컬 알림, 햅틱, 가족 프로필, 오프라인 SQLite. 첫 실행부터 50구절로 바로 사용할 수 있다(빈 앱 아님) | 심사 노트(Review Notes)에 핵심 흐름 3단계 설명 + 스크린샷 5장 이상 |
| R2 | **4.3 스팸 · 중복** | 성경 암송 앱이 이미 많은 카테고리(VerseLocker, Verses, Bible Memory App 등). 비슷한 템플릿 앱으로 보일 위험 | 중 | 차별점: ① 완전 오프라인 + 데이터 수집 없음 ② 한·영 이중 언어 카드 ③ 가족 공동 구절(한 기기) ④ 내용어 우선 빈칸. 같은 개발자 계정으로 비슷한 앱을 여러 개 내지 않는다. 템플릿 UI를 쓰지 않는다 | 설명문의 차별점 섹션, 자체 디자인 시스템(`src/ui`) |
| R3 | **2.3 정확한 메타데이터 / 이름** | "Bible Verse Keeper"(id1436688659)가 이미 있다 → 이름 혼동, 이름 등록 실패 가능 | **중~높음** | 앱 이름에 한국어 부제를 붙이거나 다른 이름 후보를 쓴다([open-questions.md](./open-questions.md) Q4). App Store Connect에서 이름 예약으로 먼저 확인한다 | App Store Connect 앱 생성 화면 결과 |
| R4 | **5.1.1 개인정보 — 수집·저장** | 개인정보처리방침 URL은 수집이 없어도 **필수**다. 가족 이름(개인정보)을 입력받음 | 중 | 방침 페이지(GitHub Pages) 게시. 이름은 기기 밖으로 나가지 않는다는 점을 명시. 계정이 없으므로 5.1.1(v) 계정 삭제 요구는 해당 없음. 대신 "모든 데이터 삭제" 기능 제공 | `docs/privacy-policy.md`(Stage 4), 설정 > 모든 데이터 삭제 |
| R5 | **5.1.1 권한 요청** | 권한을 너무 이르거나 목적 없이 요청하면 리젝 | 낮음 | 알림 권한은 사용자가 토글을 켤 때만 요청한다. 카메라·마이크·사진·위치 권한은 쓰지 않는다. 문서 선택기와 공유 시트는 권한이 필요 없다 | `Info.plist`에 Usage Description 키가 불필요하게 들어가 있지 않은지 prebuild 결과로 검사 |
| R6 | **5.1.2 데이터 사용 · 공유** | 서드파티 SDK가 몰래 데이터를 보낼 위험 | 낮음 | 분석·광고·크래시 SDK 0개. ESLint로 `fetch` 금지, 의존성 추가 시 리뷰(CLAUDE.md 규칙). 백업 JSON은 사용자가 직접 공유 시트로 내보내는 것이므로 개발자가 수집하는 것이 아니다 | `package.json` 의존성 목록, ESLint 규칙, 네트워크 0건 확인(Stage 3: 비행기 모드에서 전체 기능 동작) |
| R7 | **1.1 불쾌한 콘텐츠 (종교)** | 1.1.1은 종교 관련 비방이나 조롱 콘텐츠를 금지한다 | 낮음 | 성경 본문과 중립적 UI 문구만 사용한다. 다른 종교·교파를 언급하지 않는다. 기본 팩은 널리 알려진 구절로 구성한다 | 기본 팩 목록([spec.md](./spec.md) §4), 메타데이터 검토 |
| R8 | **1.2 사용자 생성 콘텐츠** | 사용자 입력 구절이 UGC로 분류되면 신고·차단 기능이 필요해진다 | 낮음 | 입력 내용은 기기 안에만 있고 다른 사용자에게 공개·공유되지 않으므로 1.2의 UGC(다른 사용자에게 노출되는 콘텐츠)에 해당하지 않는다. 심사 노트에 명시 | Review Notes 문구 |
| R9 | **1.3 키즈 카테고리** | 가족용이라 어린이 대상 앱으로 분류되면 Kids 요구사항(외부 링크 제한, 부모 게이트)이 적용된다 | 중 | Kids 카테고리를 **선택하지 않는다**. 카테고리는 "Education"(주) / "Reference" 또는 "Lifestyle"(보조) 제안. 메타데이터에 "for kids" 같은 표현을 쓰지 않는다 | App Store Connect 카테고리 설정 |
| R10 | **1.5 개발자 정보** | 지원 URL과 연락처가 필요하다 | 낮음 | GitHub Pages에 support 페이지(문의 이메일 자리표시) | Stage 4 `docs/support.md` |
| R11 | **2.1 앱 완성도** | 빈 상태나 크래시, 자리표시 텍스트("Lorem") 때문에 리젝 | 중 | 모든 화면의 빈·오류 상태 정의([screens.md](./screens.md) §3), TestFlight 내부 테스트, 자리표시 문자열 검사 테스트(`src/i18n/locales.test.ts`) | Stage 3 리뷰 표, TestFlight 체크리스트 |
| R12 | **4.5.4 알림** | 알림을 기능 필수 조건으로 만들거나 마케팅 목적으로 쓰면 위반 | 낮음 | 알림은 선택 사항, 기본 꺼짐, 복습 알림 용도만 | 설정 화면 |
| R13 | **저작권 (5.2)** | 저작권이 있는 번역본(개역개정 등)이 번들에 들어가면 리젝 및 법적 위험 | **높음(발생 시)** | 번들 = WEB 공개 도메인만. 한국어 본문은 사용자 입력만. CI에서 팩 JSON의 `license == "Public Domain"`과 번역 코드 허용 목록(WEB)을 검사. 테스트 픽스처는 WEB 또는 직접 만든 더미 문장만 사용 | `scripts/pack.test.ts` + `src/domain/pack/pack.ts`(번역 허용 목록·라이선스 검증, CI에서 실행), CLAUDE.md 금지사항 |
| R14 | **상표 (WEB)** | "World English Bible"은 eBible.org의 상표다. 원문을 바꾸면 그 이름을 쓸 수 없다 | 중 | WEB 원문을 **수정하지 않는다**(팩 구절의 영어 본문은 읽기 전용). 출처와 라이선스를 앱 안에 표시한다 | [spec.md](./spec.md) US-VC-2 AC4, 설정 > 정보 |
| R15 | **KJV (영국)** | KJV는 영국에서 Crown(왕실) 특허로 보호된다 → 영국 스토어 배포 시 위험 | 중 | **v1에 포함하지 않는다**(제안). 영국만 빼고 배포하는 방법도 있지만, 번역별 배포 지역을 따로 관리해야 해서 복잡하다. 사용자가 KJV 본문을 직접 입력하는 것은 허용한다 | [open-questions.md](./open-questions.md) Q1 |
| R16 | **EU DSA 거래자 지위** | EU 스토어에 배포하려면 App Store Connect에서 trader / non-trader를 신고해야 한다 | 중 | 수익이 없는 개인 개발자는 non-trader 신고를 검토한다. trader로 신고하면 주소·전화번호가 공개되므로 주의 | App Store Connect > Business |
| R17 | **SDK 요구사항** | 2026-04-28부터 업로드 빌드는 Xcode 26 / iOS 26 SDK가 필수 | 낮음 | EAS Build 최신 이미지 사용(`eas.json`의 `image: "latest"` 또는 SDK 57 기본값) | EAS 빌드 로그의 Xcode 버전 |

## 2. 개인정보 영양 라벨 (App Privacy)

**결론: "데이터 수집 안 함(Data Not Collected)"으로 신고할 수 있다.**

| 판단 기준 (Apple 정의) | Verse Keeper | 근거 |
|---|---|---|
| "수집(collect)" = 데이터를 **기기 밖으로 전송**해 개발자나 서드파티가 실시간 요청 처리 이상으로 접근할 수 있게 하는 것 | 네트워크 전송 0건 | 서버 없음, `fetch` 금지 ESLint 규칙, 네트워크 SDK 없음 |
| 기기 안에서만 처리하는 데이터는 수집이 아니다 | 이름·구절·학습 기록은 SQLite에만 저장 | [data-model.md](./data-model.md) |
| 사용자가 직접 시작한 공유 | 백업 JSON 공유 시트 | 사용자가 목적지를 고른다. 개발자에게 전달되지 않는다 |
| 서드파티 SDK | 없음(Expo 모듈은 로컬 기능만) | `package.json` |
| 추적(Tracking) | 없음, ATT 프롬프트 없음 | `NSPrivacyTracking = false` |

⚠️ 이 판단이 유지되려면 **분석·크래시 SDK를 추가하지 않아야** 한다(추가하면 라벨을 다시 신고해야 함).

## 3. Privacy Manifest (`PrivacyInfo.xcprivacy`)

> 💡 **웹 개발자 관점** — 브라우저 fingerprinting처럼, 기기를 식별하는 데 악용될 수 있는 iOS API(파일 타임스탬프, 부팅 시간, 디스크 용량, UserDefaults 등)를 쓰는 앱은 "왜 쓰는지" 사유 코드를 매니페스트에 선언해야 한다. 선언이 빠지면 업로드할 때 경고 메일이 오거나 거절된다.

| 키 | 값 |
|---|---|
| `NSPrivacyTracking` | `false` |
| `NSPrivacyTrackingDomains` | `[]` |
| `NSPrivacyCollectedDataTypes` | `[]` |

`NSPrivacyAccessedAPITypes` — expo/expo `sdk-57` 브랜치의 각 모듈 `ios/PrivacyInfo.xcprivacy`에서 확인한 값(2026-09-25):

| API 카테고리 | 사유 코드 | 출처 모듈 |
|---|---|---|
| `NSPrivacyAccessedAPICategoryUserDefaults` | `CA92.1` (앱 자체 데이터 접근) | expo-constants, expo-notifications, expo-localization, React Native 코어 |
| `NSPrivacyAccessedAPICategoryFileTimestamp` | `0A2A.1`, `3B52.1` (expo-file-system) / `C617.1` (RN 코어) | expo-file-system, React Native |
| `NSPrivacyAccessedAPICategoryDiskSpace` | `E174.1`, `85F4.1` | expo-file-system |
| `NSPrivacyAccessedAPICategorySystemBootTime` | `35F9.1` | React Native 코어 |

- Expo는 prebuild 때 각 모듈의 매니페스트를 합치지만, CocoaPods 정적 링크 환경에서는 앱 수준 선언이 필요할 수 있으므로 **`app.config.ts`의 `ios.privacyManifests`에 위 합집합을 명시**한다.
- Stage 4에서 `npx expo prebuild -p ios --clean` 결과의 `PrivacyInfo.xcprivacy`를 이 표와 비교하는 검증 스크립트를 둔다. (expo-sqlite, expo-speech, expo-haptics, expo-sharing, expo-document-picker는 sdk-57 기준 자체 매니페스트가 없음을 확인했다.)

## 4. 수출 규정 (Export Compliance)

| 질문 | 답 | 근거 |
|---|---|---|
| 앱이 암호화를 사용하는가? | 독자적인 암호화 구현 없음. 네트워크 통신(HTTPS)도 없음 | SQLite 암호화(SQLCipher) 사용 안 함, `expo-crypto`는 UUID 난수 생성에만 사용 |
| `ITSAppUsesNonExemptEncryption` | **`false`** | 면제 대상이 아닌 암호화 사용 없음 → 빌드마다 묻는 수출 규정 질문 생략 |
| 프랑스 등 추가 서류 | 불필요 | 위와 동일 |

## 5. 연령 등급

- Apple의 갱신된 연령 등급 체계(4+ / 9+ / 13+ / 16+ / 18+) 설문 기준, 폭력·성적 콘텐츠·도박·UGC·웹 접근·채팅이 모두 "없음" → **4+** 예상.
- 성경 본문 일부(예: 전쟁 서술)는 기본 팩에 넣지 않는다 — 기본 팩 50구절은 위로·신앙 고백 중심이다.
- 의료·건강 정보 없음, 광고 없음, 인앱 결제 없음.

## 6. 심사 노트 초안 (Stage 4에서 확정)

```text
Verse Keeper is a fully offline Scripture memorization app. No account, no login, no server,
no analytics. All data is stored locally on device (SQLite).
Try: Home → "Start review" is empty on first launch; open "Verses" → pick John 3:16 → "Start learning"
→ practice in Cloze / First-letter / Listen modes → grade with one of 4 buttons.
Bundled English text is the World English Bible (public domain). Korean text is user-entered only.
User-entered content never leaves the device and is not visible to other users.
Notifications are optional local reminders (off by default).
```
