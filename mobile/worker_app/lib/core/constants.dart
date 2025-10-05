import 'env.dart';

/// Shared constants between web and mobile applications
class AppConstants {
  // Brand
  static const String appName = 'Điện lạnh Quy';
  static const String appNameWorker = '$appName - Worker';
  static const String appNameCustomer = '$appName - Customer';

  // Status Values (matching backend)
  static const String statusPending = 'pending';
  static const String statusConfirmed = 'confirmed';
  static const String statusDone = 'done';
  static const String statusCancelled = 'cancelled';

  // Status Labels (Vietnamese)
  static const Map<String, String> statusLabels = {
    statusPending: 'Chờ xác nhận',
    statusConfirmed: 'Đã xác nhận',
    statusDone: 'Hoàn thành',
    statusCancelled: 'Đã hủy',
  };

  // User Roles
  static const String roleCustomer = 'customer';
  static const String roleWorker = 'worker';
  static const String roleAdmin = 'admin';

  // API Endpoints Base
  static String get defaultApiUrl => Env.apiBase;

  // Spacing
  static const double spacingSmall = 8.0;
  static const double spacingMedium = 16.0;
  static const double spacingLarge = 24.0;
  static const double spacingXLarge = 32.0;

  // Font Sizes
  static const double fontSizeSmall = 12.0;
  static const double fontSizeMedium = 14.0;
  static const double fontSizeLarge = 16.0;
  static const double fontSizeXLarge = 20.0;
  static const double fontSizeXXLarge = 24.0;

  // Common Labels
  static const String labelService = 'Dịch vụ';
  static const String labelCustomer = 'Khách hàng';
  static const String labelWorker = 'Thợ';
  static const String labelPhone = 'Số điện thoại';
  static const String labelAddress = 'Địa chỉ';
  static const String labelDate = 'Ngày giờ';
  static const String labelStatus = 'Trạng thái';
  static const String labelNote = 'Ghi chú';
  static const String labelPrice = 'Giá';
  static const String labelName = 'Tên';
  static const String labelPassword = 'Mật khẩu';

  // Common Messages
  static const String msgLoading = 'Đang tải...';
  static const String msgNoData = 'Chưa có dữ liệu';
  static const String msgError = 'Có lỗi xảy ra';
  static const String msgSuccess = 'Thành công';
  static const String msgConfirm = 'Xác nhận';
  static const String msgCancel = 'Hủy';
  static const String msgSave = 'Lưu';
  static const String msgEdit = 'Sửa';
  static const String msgDelete = 'Xóa';
  static const String msgClose = 'Đóng';

  // Navigation Labels
  static const String navHome = 'Trang chủ';
  static const String navBookings = 'Đơn hàng';
  static const String navServices = 'Dịch vụ';
  static const String navProfile = 'Hồ sơ';
  static const String navLogin = 'Đăng nhập';
  static const String navRegister = 'Đăng ký';
  static const String navLogout = 'Đăng xuất';
}
