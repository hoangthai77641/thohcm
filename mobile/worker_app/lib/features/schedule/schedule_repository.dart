import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/constants/api_constants.dart';
import '../../core/services/token_service.dart';
import '../../core/utils/api_response.dart';
import 'schedule_model.dart';

class ScheduleRepository {
  final TokenService _tokenService = TokenService();

  // Lấy thông tin công việc hiện tại
  Future<ApiResponse<CurrentJobResponse>> getCurrentJob() async {
    try {
      final token = await _tokenService.getToken();
      if (token == null) {
        return ApiResponse.error('Không tìm thấy token xác thực');
      }

      final response = await http.get(
        Uri.parse('${ApiConstants.baseUrl}/schedules/current-job'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return ApiResponse.success(CurrentJobResponse.fromJson(data));
      } else {
        final errorData = json.decode(response.body);
        return ApiResponse.error(
          errorData['message'] ?? 'Lỗi khi lấy thông tin công việc',
        );
      }
    } catch (e) {
      return ApiResponse.error('Lỗi kết nối: $e');
    }
  }

  // Lấy lịch rãnh của thợ
  Future<ApiResponse<WorkerSchedule>> getMySchedule() async {
    try {
      final token = await _tokenService.getToken();
      if (token == null) {
        return ApiResponse.error('Không tìm thấy token xác thực');
      }

      final response = await http.get(
        Uri.parse('${ApiConstants.baseUrl}/schedules/my-schedule'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return ApiResponse.success(WorkerSchedule.fromJson(data));
      } else {
        final errorData = json.decode(response.body);
        return ApiResponse.error(
          errorData['message'] ?? 'Lỗi khi lấy lịch rãnh',
        );
      }
    } catch (e) {
      return ApiResponse.error('Lỗi kết nối: $e');
    }
  }

  // Cập nhật thời gian dự kiến hoàn thành khi bắt đầu công việc
  Future<ApiResponse<String>> startJobWithEstimatedTime({
    required String bookingId,
    required DateTime estimatedCompletionTime,
    DateTime? actualStartTime,
  }) async {
    try {
      final token = await _tokenService.getToken();
      if (token == null) {
        return ApiResponse.error('Không tìm thấy token xác thực');
      }

      final response = await http.post(
        Uri.parse('${ApiConstants.baseUrl}/schedules/start-job'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'bookingId': bookingId,
          'estimatedCompletionTime': estimatedCompletionTime.toIso8601String(),
          'actualStartTime': (actualStartTime ?? DateTime.now())
              .toIso8601String(),
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return ApiResponse.success(data['message'] ?? 'Cập nhật thành công');
      } else {
        final errorData = json.decode(response.body);
        return ApiResponse.error(
          errorData['message'] ?? 'Lỗi khi cập nhật thời gian dự kiến',
        );
      }
    } catch (e) {
      return ApiResponse.error('Lỗi kết nối: $e');
    }
  }

  // Cập nhật thời gian dự kiến hoàn thành
  Future<ApiResponse<String>> updateEstimatedTime({
    required DateTime newEstimatedCompletionTime,
  }) async {
    try {
      final token = await _tokenService.getToken();
      if (token == null) {
        return ApiResponse.error('Không tìm thấy token xác thực');
      }

      final response = await http.put(
        Uri.parse('${ApiConstants.baseUrl}/schedules/update-estimated-time'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'newEstimatedCompletionTime': newEstimatedCompletionTime
              .toIso8601String(),
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return ApiResponse.success(data['message'] ?? 'Cập nhật thành công');
      } else {
        final errorData = json.decode(response.body);
        return ApiResponse.error(
          errorData['message'] ?? 'Lỗi khi cập nhật thời gian dự kiến',
        );
      }
    } catch (e) {
      return ApiResponse.error('Lỗi kết nối: $e');
    }
  }

  // Hoàn thành công việc hiện tại
  Future<ApiResponse<String>> completeCurrentJob({String? bookingId}) async {
    try {
      final token = await _tokenService.getToken();
      if (token == null) {
        return ApiResponse.error('Không tìm thấy token xác thực');
      }

      final response = await http.post(
        Uri.parse('${ApiConstants.baseUrl}/schedules/complete-job'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({if (bookingId != null) 'bookingId': bookingId}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return ApiResponse.success(
          data['message'] ?? 'Hoàn thành công việc thành công',
        );
      } else {
        final errorData = json.decode(response.body);
        return ApiResponse.error(
          errorData['message'] ?? 'Lỗi khi hoàn thành công việc',
        );
      }
    } catch (e) {
      return ApiResponse.error('Lỗi kết nối: $e');
    }
  }

  // Thêm khung giờ rãnh mới
  Future<ApiResponse<String>> addAvailableSlot({
    required DateTime startTime,
    required DateTime endTime,
    String? note,
  }) async {
    try {
      final token = await _tokenService.getToken();
      if (token == null) {
        return ApiResponse.error('Không tìm thấy token xác thực');
      }

      final response = await http.post(
        Uri.parse('${ApiConstants.baseUrl}/schedules/add-slot'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'startTime': startTime.toIso8601String(),
          'endTime': endTime.toIso8601String(),
          'note': note ?? '',
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return ApiResponse.success(
          data['message'] ?? 'Thêm khung giờ rãnh thành công',
        );
      } else {
        final errorData = json.decode(response.body);
        return ApiResponse.error(
          errorData['message'] ?? 'Lỗi khi thêm khung giờ rãnh',
        );
      }
    } catch (e) {
      return ApiResponse.error('Lỗi kết nối: $e');
    }
  }

  // Xóa khung giờ rãnh
  Future<ApiResponse<String>> removeAvailableSlot(String slotId) async {
    try {
      final token = await _tokenService.getToken();
      if (token == null) {
        return ApiResponse.error('Không tìm thấy token xác thực');
      }

      final response = await http.delete(
        Uri.parse('${ApiConstants.baseUrl}/schedules/remove-slot/$slotId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return ApiResponse.success(
          data['message'] ?? 'Xóa khung giờ rãnh thành công',
        );
      } else {
        final errorData = json.decode(response.body);
        return ApiResponse.error(
          errorData['message'] ?? 'Lỗi khi xóa khung giờ rãnh',
        );
      }
    } catch (e) {
      return ApiResponse.error('Lỗi kết nối: $e');
    }
  }

  // Tự động tạo lịch rãnh cho nhiều ngày
  Future<ApiResponse<String>> generateScheduleForDays(int days) async {
    try {
      final token = await _tokenService.getToken();
      if (token == null) {
        return ApiResponse.error('Không tìm thấy token xác thực');
      }

      final response = await http.post(
        Uri.parse('${ApiConstants.baseUrl}/schedules/generate-schedule'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({'days': days}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return ApiResponse.success(
          data['message'] ?? 'Tạo lịch rãnh thành công',
        );
      } else {
        final errorData = json.decode(response.body);
        return ApiResponse.error(
          errorData['message'] ?? 'Lỗi khi tạo lịch rãnh',
        );
      }
    } catch (e) {
      return ApiResponse.error('Lỗi kết nối: $e');
    }
  }

  // Lấy khung giờ mặc định
  Future<ApiResponse<DefaultTimeSlots>> getDefaultTimeSlots() async {
    try {
      final token = await _tokenService.getToken();
      if (token == null) {
        return ApiResponse.error('Không tìm thấy token xác thực');
      }

      final response = await http.get(
        Uri.parse('${ApiConstants.baseUrl}/schedules/default-time-slots'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return ApiResponse.success(DefaultTimeSlots.fromJson(data));
      } else {
        final errorData = json.decode(response.body);
        return ApiResponse.error(
          errorData['message'] ?? 'Lỗi khi lấy khung giờ mặc định',
        );
      }
    } catch (e) {
      return ApiResponse.error('Lỗi kết nối: $e');
    }
  }

  // Cập nhật lịch sau khi hoàn thành đơn
  Future<ApiResponse<String>> updateAvailabilityAfterBooking({
    DateTime? completedBookingTime,
    int additionalDays = 3,
  }) async {
    try {
      final token = await _tokenService.getToken();
      if (token == null) {
        return ApiResponse.error('Không tìm thấy token xác thực');
      }

      final response = await http.post(
        Uri.parse(
          '${ApiConstants.baseUrl}/schedules/update-availability-after-booking',
        ),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'completedBookingTime': (completedBookingTime ?? DateTime.now())
              .toIso8601String(),
          'additionalDays': additionalDays,
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return ApiResponse.success(
          data['message'] ?? 'Cập nhật lịch khả dụng thành công',
        );
      } else {
        final errorData = json.decode(response.body);
        return ApiResponse.error(
          errorData['message'] ?? 'Lỗi khi cập nhật lịch khả dụng',
        );
      }
    } catch (e) {
      return ApiResponse.error('Lỗi kết nối: $e');
    }
  }

  // Thợ tự cập nhật khung giờ khả dụng
  Future<ApiResponse<String>> updateCustomAvailability({
    required String date,
    required List<String> availableHours,
  }) async {
    try {
      final token = await _tokenService.getToken();
      if (token == null) {
        return ApiResponse.error('Không tìm thấy token xác thực');
      }

      final response = await http.put(
        Uri.parse('${ApiConstants.baseUrl}/schedules/custom-availability'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({'date': date, 'availableHours': availableHours}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return ApiResponse.success(
          data['message'] ?? 'Cập nhật khung giờ khả dụng thành công',
        );
      } else {
        final errorData = json.decode(response.body);
        return ApiResponse.error(
          errorData['message'] ?? 'Lỗi khi cập nhật khung giờ khả dụng',
        );
      }
    } catch (e) {
      return ApiResponse.error('Lỗi kết nối: $e');
    }
  }

  // Gia hạn thời gian làm việc
  Future<ApiResponse<String>> extendWorkTime({
    required String bookingId,
    required int additionalHours,
  }) async {
    try {
      final token = await _tokenService.getToken();
      if (token == null) {
        return ApiResponse.error('Không tìm thấy token xác thực');
      }

      final response = await http.post(
        Uri.parse('${ApiConstants.baseUrl}/schedules/extend-work-time'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'bookingId': bookingId,
          'additionalHours': additionalHours,
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return ApiResponse.success(
          data['message'] ?? 'Gia hạn thời gian thành công',
        );
      } else {
        final errorData = json.decode(response.body);
        return ApiResponse.error(
          errorData['message'] ?? 'Lỗi khi gia hạn thời gian',
        );
      }
    } catch (e) {
      return ApiResponse.error('Lỗi kết nối: $e');
    }
  }
}
