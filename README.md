# Verse Keeper

완전 오프라인 성경 암송 iOS 앱. 광고, 추적, 로그인, 서버가 없습니다.

- 간격 반복(SM-2 변형), 빈칸 채우기, 첫 글자 힌트, 듣기(TTS 단어 하이라이트)
- 한국어/영어 카드를 따로 관리하고, 한 기기에서 가족 프로필과 이번 주 가족 구절을 함께 씀
- 기본 팩: World English Bible(공개 도메인) 50구절. 한국어 본문은 사용자가 직접 입력
- 로컬 알림, JSON 백업·복원, 다크 모드, 한/영 UI

## 빠른 시작

```bash
npm ci
npm run verify        # typecheck + lint + test(coverage)
npx expo start        # iPhone의 Expo Go로 QR 코드를 스캔
```

## 출시

[docs/release.md](docs/release.md): Apple Developer 가입 → `eas build` → `eas submit` → TestFlight → App Store (Mac 없이 진행)

## 문서

| 문서 | 내용 |
|---|---|
| [docs/spec.md](docs/spec.md) | 기능 명세, 수용 기준, 비범위 |
| [docs/screens.md](docs/screens.md) | 라우트 맵, 화면 흐름, 화면 상태 |
| [docs/data-model.md](docs/data-model.md) | SQLite 스키마, 마이그레이션, 백업 형식 |
| [docs/algorithms.md](docs/algorithms.md) | SM-2 수식·테스트 벡터, 토큰화, 빈칸, streak |
| [docs/architecture.md](docs/architecture.md) | 기술 스택, 폴더 구조, 의존 규칙 |
| [docs/app-review-risks.md](docs/app-review-risks.md) | 심사 리스크, 개인정보 라벨, Privacy Manifest |
| [docs/review-stage3.md](docs/review-stage3.md) | 접근성·성능·심사 기준 리뷰 결과 |
| [docs/store-metadata.md](docs/store-metadata.md) | App Store 메타데이터 초안(ko/en), 스크린샷 규격 |
| [docs/privacy-policy.md](docs/privacy-policy.md) · [docs/support.md](docs/support.md) | 개인정보처리방침·지원 페이지 초안 |
| [docs/assets-checklist.md](docs/assets-checklist.md) | 아이콘·스플래시 규격 |
| [docs/open-questions.md](docs/open-questions.md) | 결정 사항과 남은 질문 |
| [CLAUDE.md](CLAUDE.md) | 개발 규칙, 금지사항, 커밋 규칙 |
