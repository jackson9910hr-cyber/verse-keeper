# Verse Keeper

완전 오프라인 성경 암송 iOS 앱 — 광고·추적·로그인·서버 없음.

- 간격 반복(SM-2 변형) · 빈칸 채우기 · 첫 글자 힌트 · 듣기(TTS)
- 한국어/영어 이중 카드 · 가족 공동 구절(한 기기, 로컬 프로필)
- 기본 팩: World English Bible(공개 도메인) 50구절

## 현재 상태

**Stage 0 — 설계 문서 (승인 대기)**

| 문서 | 내용 |
|---|---|
| [docs/spec.md](docs/spec.md) | 기능 명세, 사용자 스토리, 수용 기준, 비범위 |
| [docs/screens.md](docs/screens.md) | 라우트 맵, 화면 흐름(Mermaid), 화면별 상태 |
| [docs/data-model.md](docs/data-model.md) | SQLite DDL, ERD, 인덱스, 마이그레이션, 백업 형식 |
| [docs/algorithms.md](docs/algorithms.md) | SM-2 변형 수식·테스트 벡터, 토큰화, 빈칸·힌트·streak·주간 규칙, 경계 사례 |
| [docs/architecture.md](docs/architecture.md) | 기술 스택 검증, 상태 관리, 폴더 구조, 의존 규칙 |
| [docs/app-review-risks.md](docs/app-review-risks.md) | 심사 리스크, 개인정보 라벨, Privacy Manifest, 수출 규정, 연령 등급 |
| [docs/open-questions.md](docs/open-questions.md) | 결정 필요 사항과 권장안 |
| [CLAUDE.md](CLAUDE.md) | 개발 명령, 코딩·폴더 규칙, 금지사항, 커밋 규칙 |
