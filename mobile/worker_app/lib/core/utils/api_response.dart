class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? error;
  final String? message;

  ApiResponse._({required this.success, this.data, this.error, this.message});

  // Constructor cho success response
  factory ApiResponse.success(T data, {String? message}) {
    return ApiResponse._(success: true, data: data, message: message);
  }

  // Constructor cho error response
  factory ApiResponse.error(String error) {
    return ApiResponse._(success: false, error: error);
  }

  // Getter để kiểm tra có lỗi không
  bool get hasError => !success;

  // Getter để lấy message hiển thị
  String get displayMessage {
    if (hasError) return error ?? 'Có lỗi xảy ra';
    return message ?? 'Thành công';
  }
}

// Extension để handle API response dễ dàng hơn
extension ApiResponseExtension<T> on ApiResponse<T> {
  // Thực thi callback nếu success
  void onSuccess(void Function(T data) callback) {
    if (success && data != null) {
      callback(data!);
    }
  }

  // Thực thi callback nếu error
  void onError(void Function(String error) callback) {
    if (hasError && error != null) {
      callback(error!);
    }
  }

  // Transform data nếu success
  ApiResponse<R> map<R>(R Function(T data) mapper) {
    if (success && data != null) {
      try {
        return ApiResponse.success(mapper(data!), message: message);
      } catch (e) {
        return ApiResponse.error('Error mapping data: $e');
      }
    }
    return ApiResponse.error(error ?? 'No data to map');
  }
}
