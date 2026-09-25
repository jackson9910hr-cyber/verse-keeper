# Verse Keeper — 출시 가이드 (Apple Developer 가입 → TestFlight → App Store)

> **Mac 없이** 진행하는 경로를 기준으로 한다. 빌드와 서명은 EAS(Expo Application Services) 클라우드에서 한다.
> 💡 웹 비유: EAS Build = "iOS용 Vercel 빌드 서버", EAS Submit = "App Store로 자동 업로드", TestFlight = "베타 배포용 스테이징 URL".
> 2026-04-28부터 App Store Connect 업로드는 Xcode 26 / iOS 26 SDK로 빌드해야 한다. SDK 57 기본 EAS 이미지가 이 조건을 충족한다(빌드 로그의 Xcode 버전으로 확인).

## 0. 준비물 (한 번만)

| 항목 | 방법 | 소요 |
|---|---|---|
| Apple Developer Program | https://developer.apple.com/programs/enroll/ → 개인(Individual) 등록, 연 US$99 | 보통 24~48시간 |
| Expo 계정 | https://expo.dev/signup (무료) | 즉시 |
| Node.js 22 LTS | https://nodejs.org | — |
| 앱 이름·Bundle ID 결정 | [open-questions.md](./open-questions.md) Q4·Q5. **Bundle ID는 등록 후 바꿀 수 없다** | — |
| 개인정보처리방침·지원 URL | 아래 §7 GitHub Pages | 10분 |

## 1. 로컬 검증

```bash
git clone <repo> && cd verse-keeper
npm ci
npm run verify          # typecheck + lint + test(coverage)
npx expo-doctor         # SDK/의존성 호환성 점검
```

## 2. Expo 로그인과 EAS 프로젝트 연결

```bash
npx eas-cli@latest login
npx eas-cli@latest init            # EAS 프로젝트 생성 → projectId 출력
```
출력된 projectId를 `app.config.ts`의 `EAS_PROJECT_ID` 기본값('' 자리)에 붙여 넣고 커밋한다.

```bash
npx eas-cli@latest build:configure # eas.json이 이미 있으므로 iOS 선택 후 그대로 유지
```

## 3. Bundle ID 확정

`app.config.ts`의 `BUNDLE_ID` 기본값(`io.github.jackson9910hr-cyber.versekeeper`)을 확정한 값으로 바꾸거나, 빌드할 때 환경 변수로 지정한다.

```bash
IOS_BUNDLE_ID=com.yourname.versekeeper npx eas-cli@latest build -p ios --profile production
```

## 4. 프로덕션 빌드 (클라우드)

```bash
npx eas-cli@latest build -p ios --profile production
```
- 처음 실행하면 Apple ID 로그인(2단계 인증)을 묻는다. EAS가 **Bundle ID 등록, 배포 인증서, 프로비저닝 프로파일**을 자동으로 만든다(모두 "Yes").
- `buildNumber`는 `eas.json`의 `autoIncrement` + `appVersionSource: remote`로 자동 증가한다.
- 완료되면 `.ipa` 링크가 나온다(약 15~25분).

> 실기기 사전 테스트(선택): `npx eas-cli@latest device:create`로 iPhone을 등록한 뒤 `npx eas-cli@latest build -p ios --profile preview` → 링크로 설치.

## 5. App Store Connect에 앱 만들기

https://appstoreconnect.apple.com → **나의 앱 → + → 신규 앱**
- 플랫폼: iOS / 이름: 확정한 앱 이름 / 기본 언어: 한국어 / 번들 ID: 4단계에서 등록된 ID / SKU: `verse-keeper-001`
- 사용자 액세스: 전체 액세스

## 6. TestFlight 업로드와 내부 테스터

```bash
npx eas-cli@latest submit -p ios --latest
```
- App Store Connect 앱을 선택하거나 ASC App ID(앱 정보 > Apple ID 숫자)를 입력한다. App Store Connect API 키를 만들라는 안내가 나오면 "Yes"(EAS가 대신 생성·보관).
- 업로드 뒤 처리(5~30분)가 끝나면 TestFlight 탭에 빌드가 나타난다. `ITSAppUsesNonExemptEncryption=false`이므로 **수출 규정 질문은 자동으로 건너뛴다.**
- **내부 테스터 초대**: App Store Connect → 사용자 및 액세스에서 가족 계정(Apple ID) 추가 → TestFlight → 내부 테스트 → 그룹 만들기 → 테스터와 빌드 추가 → 테스터는 iPhone에서 **TestFlight 앱**으로 설치.
- 외부 테스터(교회 소그룹 등)는 "외부 테스트" 그룹 → 베타 앱 심사(보통 1일) 후 공개 링크 배포.

## 7. 개인정보처리방침·지원 페이지 호스팅 (GitHub Pages)

App Store는 개인정보처리방침 URL을 **필수**로 요구한다.
1. GitHub에 **public** 저장소 `verse-keeper-site`를 만든다(비공개 저장소의 Pages는 유료 플랜이 필요하고, 이 앱 저장소의 설계 문서를 공개할 필요도 없다).
2. 이 저장소의 `docs/privacy-policy.md`, `docs/support.md`를 복사해 넣고 `support@example.com`을 실제 주소로 바꾼다. `privacy-policy.md` 이름은 그대로 두거나 `index.md`로 만든다.
3. 저장소 **Settings → Pages → Source: Deploy from a branch → main / (root)** → Save.
4. 1~2분 뒤 `https://<github-id>.github.io/verse-keeper-site/privacy-policy` 와 `/support` 가 열리는지 확인한다.

## 8. App Store 제출

App Store Connect → 앱 → **iOS 앱 1.0 준비 중**
1. 스크린샷·설명·키워드: [store-metadata.md](./store-metadata.md)
2. **앱 개인정보 보호** → "데이터 수집 안 함" 선택 → 게시 (근거: [app-review-risks.md](./app-review-risks.md) §2)
3. **연령 등급** 설문: 모두 "없음" → 4+
4. 카테고리: 교육(Education) / 보조: 참고(Reference) — Kids 카테고리는 선택하지 않는다
5. 개인정보처리방침 URL, 지원 URL(7단계)
6. 가격: 무료 / 배포 국가: 전체(또는 선택)
7. **EU DSA**: 비즈니스 → 거래자 상태 → 수익 없는 개인이면 "거래자 아님" 검토
8. 빌드 선택(TestFlight 빌드) → **심사 노트**: [store-metadata.md](./store-metadata.md) §Review Notes 붙여 넣기 → **심사에 제출**

## 9. 이후 업데이트

```bash
# app.config.ts의 version을 올린다 (예: 1.0.1) — buildNumber는 자동
npm run verify
npx eas-cli@latest build -p ios --profile production --auto-submit
```

## 부록 A. 개발 중 실기기 확인 (Expo Go)

```bash
npx expo start          # 터미널의 QR 코드를 iPhone 카메라로 스캔 → Expo Go에서 열림
```
- App Store에서 **Expo Go**(SDK 57 지원 버전)를 설치한다. PC와 iPhone이 같은 Wi‑Fi에 있어야 한다(아니면 `npx expo start --tunnel`).
- 이 앱이 쓰는 모듈(SQLite, Speech, 로컬 알림, Haptics, 파일/공유, 문서 선택기, SF Symbols, DateTimePicker)은 모두 Expo Go에 포함되어 있다.
- `development` 프로필(개발 빌드)이 필요해지면 먼저 `npx expo install expo-dev-client`를 실행한 뒤 `npx eas-cli@latest build -p ios --profile development`.

## 부록 B. 문제 해결

| 증상 | 해결 |
|---|---|
| `Invalid bundle identifier` | 영문·숫자·하이픈·점만 사용, 이미 다른 팀이 쓰는 ID인지 확인 |
| 빌드 로그에 Xcode 버전이 26 미만 | `eas.json` 프로필에 `"ios": { "image": "latest" }` 추가 |
| 업로드 후 "Missing Compliance" | `ITSAppUsesNonExemptEncryption`이 Info.plist에 있는지 prebuild로 확인 |
| 한국어 음성이 나오지 않음 | 기기 설정에서 한국어 음성 다운로드 |
