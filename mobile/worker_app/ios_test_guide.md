# Hướng dẫn Test iOS App từ Windows

## Phương án 1: Sử dụng macOS
1. **Cần máy Mac** hoặc **Hackintosh**
2. Cài đặt Xcode từ App Store
3. Cài đặt Flutter: `brew install flutter`
4. Kết nối iPhone qua USB
5. Enable Developer Mode trên iPhone
6. Run: `flutter run -d [device-id]`

## Phương án 2: Cloud Development Services

### A. GitHub Codespaces với macOS runner
```yaml
# .github/workflows/ios-test.yml
name: iOS Test
on: [push, pull_request]
jobs:
  ios-test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
      - run: flutter test
      - run: flutter build ios --debug --no-codesign
```

### B. Codemagic (CI/CD cho Flutter)
- Hỗ trợ iOS build và test
- Free tier: 500 build minutes/month
- Setup: https://codemagic.io/

### C. Bitrise (CI/CD)
- Chuyên về mobile app CI/CD
- Hỗ trợ iOS Simulator testing
- Setup: https://bitrise.io/

## Phương án 3: Web Testing (Hiện tại khả dụng)
```bash
# Test trên web browser
cd mobile/worker_app
flutter run -d chrome
```

## Phương án 4: Sử dụng Firebase App Distribution
1. Build APK trên Windows: `flutter build apk`
2. Upload lên Firebase App Distribution
3. Share với iOS testers qua TestFlight

## Cấu hình hiện tại (Windows):
- ✅ Android development: Hoạt động
- ✅ Web development: Hoạt động  
- ❌ iOS development: Không khả dụng
- ❌ Windows desktop: Cần Visual Studio

## Khuyến nghị:
1. **Ưu tiên Android testing** trên Windows
2. **Web testing** cho UI/UX validation
3. **Thuê macOS cloud instance** cho iOS testing
4. **Mua Mac Mini** nếu cần iOS development thường xuyên