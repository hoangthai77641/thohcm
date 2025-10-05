# Worker App

Ứng dụng Flutter dành cho thợ Điện Lạnh Quy.

## Cấu hình API động

Ứng dụng đọc base URL của backend thông qua `Env.apiBase`. Giá trị này có thể
được truyền bằng `--dart-define` khi chạy ứng dụng:

```pwsh
flutter run --dart-define API_BASE=http://192.168.6.101:5000
```

Nếu `API_BASE` không được truyền thì ứng dụng sẽ tự chọn:

- `http://10.0.2.2:5000` khi chạy trên Android emulator
- `http://127.0.0.1:5000` trên iOS simulator
- `http://localhost:5000` cho desktop/web

## Debug trên máy thật qua Wi-Fi

1. Ghép đôi và kết nối thiết bị với `adb` qua Wi-Fi (`adb pair`, `adb connect`).
2. Từ thư mục `mobile/worker_app`, chạy script:

```pwsh
pwsh ./tools/wifi_debug.ps1 -Device 192.168.6.103:44851
```

Script sẽ:

- Tự dò IPv4 của máy tính (hoặc bạn có thể truyền thủ công với `-HostIp 192.168.6.101`).
- Thiết lập `adb reverse tcp:5000` để có thể dùng `localhost`/`10.0.2.2`.
- Chạy `flutter run` với `--dart-define API_BASE=http://<ip-may-ban>:5000`.

### Tham số bổ sung

| Tham số         | Mô tả                                                                 |
|-----------------|-----------------------------------------------------------------------|
| `-Device`       | ID thiết bị (vd `R9AT901LSCJ`) hoặc endpoint Wi-Fi (`192.168.6.103:44851`). |
| `-HostIp`       | IP backend nếu muốn ghi đè kết quả auto-detect.                        |
| `-Port`         | Cổng backend (mặc định 5000).                                          |
| `-FlutterArgs`  | Tham số bổ sung truyền cho `flutter run`.                              |

Ví dụ chạy kiểm thử với tên build cụ thể:

```pwsh
pwsh ./tools/wifi_debug.ps1 -Device R9AT901LSCJ -FlutterArgs '--release'
```

## Kiểm thử nhanh

Sau khi cập nhật code, nên chạy lại phân tích tĩnh:

```pwsh
flutter analyze
```

Hoặc các bài test đơn vị (nếu có):

```pwsh
flutter test
```
