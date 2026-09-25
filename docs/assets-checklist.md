# 아이콘·스플래시 규격 체크리스트

현재 `assets/icon.png`, `assets/splash-icon.png`는 **Expo 템플릿의 자리표시 이미지**다. 출시 전에 교체한다.

## 앱 아이콘 `assets/icon.png`
- [ ] 1024×1024 px, PNG, sRGB 또는 Display P3
- [ ] **알파 채널(투명) 없음** — App Store 업로드 오류(ITMS-90717) 방지. 확인: `file assets/icon.png` → `RGB`(RGBA 아님)
- [ ] 모서리를 직접 둥글게 만들지 않는다(iOS가 마스크 적용)
- [ ] 중요 요소는 가운데 약 80% 안에 둔다. 작은 크기(40px)에서도 알아볼 수 있는지 확인
- [ ] 다크/틴트 아이콘(iOS 18+)은 선택: `ios.icon: { light, dark, tinted }` 로 지정 가능
- [ ] 저작권 있는 이미지·서체·타 브랜드 로고 사용 금지

## 스플래시 `assets/splash-icon.png` (expo-splash-screen 플러그인)
- [ ] 정사각형 PNG(권장 1024×1024, 투명 배경 허용), 로고만 두고 여백 충분히
- [ ] 표시 폭 `imageWidth: 180` (app.config.ts) — 라이트 배경 `#F6F4EF`, 다크 배경 `#121212`에서 모두 보이는지 확인
- [ ] 텍스트를 넣지 않는다(현지화·Dynamic Type 불가)

## 스토어 스크린샷
- [store-metadata.md](./store-metadata.md) §스크린샷 규격 참고. 상태 표시줄의 시간·배터리를 깔끔하게(9:41 권장), 개인 이름 대신 예시 이름 사용.

## 교체 후 확인
```bash
npx expo-doctor
CI=1 npx expo prebuild -p ios --no-install --clean   # 스크래치 복사본에서 실행 권장
```
