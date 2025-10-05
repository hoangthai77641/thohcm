import 'package:flutter/foundation.dart';
import 'schedule_model.dart';
import 'schedule_repository.dart';
import '../../core/utils/api_response.dart';

class ScheduleProvider extends ChangeNotifier {
  final ScheduleRepository _repository = ScheduleRepository();

  // State variables
  WorkerSchedule? _schedule;
  CurrentJobResponse? _currentJob;
  bool _isLoading = false;
  String? _error;

  // Getters
  WorkerSchedule? get schedule => _schedule;
  CurrentJobResponse? get currentJob => _currentJob;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasCurrentJob => _currentJob?.hasCurrentJob ?? false;
  bool get isAvailable => _currentJob?.status == 'available';

  // Lấy thông tin công việc hiện tại
  Future<void> getCurrentJob() async {
    _setLoading(true);
    _clearError();

    final response = await _repository.getCurrentJob();

    if (response.success) {
      _currentJob = response.data;
    } else {
      _setError(response.error ?? 'Lỗi khi lấy thông tin công việc');
    }

    _setLoading(false);
  }

  // Lấy lịch rãnh của thợ
  Future<void> getMySchedule() async {
    _setLoading(true);
    _clearError();

    final response = await _repository.getMySchedule();

    if (response.success) {
      _schedule = response.data;
    } else {
      _setError(response.error ?? 'Lỗi khi lấy lịch rãnh');
    }

    _setLoading(false);
  }

  // Bắt đầu công việc với thời gian dự kiến
  Future<bool> startJobWithEstimatedTime({
    required String bookingId,
    required DateTime estimatedCompletionTime,
    DateTime? actualStartTime,
  }) async {
    _setLoading(true);
    _clearError();

    final response = await _repository.startJobWithEstimatedTime(
      bookingId: bookingId,
      estimatedCompletionTime: estimatedCompletionTime,
      actualStartTime: actualStartTime,
    );

    if (response.success) {
      // Refresh current job after starting
      await getCurrentJob();
      await getMySchedule();
      _setLoading(false);
      return true;
    } else {
      _setError(response.error ?? 'Lỗi khi bắt đầu công việc');
      _setLoading(false);
      return false;
    }
  }

  // Cập nhật thời gian dự kiến
  Future<bool> updateEstimatedTime(DateTime newEstimatedTime) async {
    _setLoading(true);
    _clearError();

    final response = await _repository.updateEstimatedTime(
      newEstimatedCompletionTime: newEstimatedTime,
    );

    if (response.success) {
      // Refresh current job after updating
      await getCurrentJob();
      await getMySchedule();
      _setLoading(false);
      return true;
    } else {
      _setError(response.error ?? 'Lỗi khi cập nhật thời gian dự kiến');
      _setLoading(false);
      return false;
    }
  }

  // Hoàn thành công việc hiện tại
  Future<bool> completeCurrentJob({String? bookingId}) async {
    _setLoading(true);
    _clearError();

    final response = await _repository.completeCurrentJob(bookingId: bookingId);

    if (response.success) {
      // Refresh state after completing job
      await getCurrentJob();
      await getMySchedule();
      _setLoading(false);
      return true;
    } else {
      _setError(response.error ?? 'Lỗi khi hoàn thành công việc');
      _setLoading(false);
      return false;
    }
  }

  // Thêm khung giờ rãnh mới
  Future<bool> addAvailableSlot({
    required DateTime startTime,
    required DateTime endTime,
    String? note,
  }) async {
    _setLoading(true);
    _clearError();

    print('ScheduleProvider: Adding slot from $startTime to $endTime');
    final response = await _repository.addAvailableSlot(
      startTime: startTime,
      endTime: endTime,
      note: note,
    );

    print(
      'ScheduleProvider: Response success: ${response.success}, error: ${response.error}',
    );
    if (response.success) {
      // Refresh schedule after adding slot
      await getMySchedule();
      _setLoading(false);
      return true;
    } else {
      _setError(response.error ?? 'Lỗi khi thêm khung giờ rãnh');
      _setLoading(false);
      return false;
    }
  }

  // Xóa khung giờ rãnh
  Future<bool> removeAvailableSlot(String slotId) async {
    _setLoading(true);
    _clearError();

    final response = await _repository.removeAvailableSlot(slotId);

    if (response.success) {
      // Refresh schedule after removing slot
      await getMySchedule();
      _setLoading(false);
      return true;
    } else {
      _setError(response.error ?? 'Lỗi khi xóa khung giờ rãnh');
      _setLoading(false);
      return false;
    }
  }

  // Tự động tạo lịch rãnh
  Future<bool> generateScheduleForDays(int days) async {
    _setLoading(true);
    _clearError();

    final response = await _repository.generateScheduleForDays(days);

    if (response.success) {
      // Refresh schedule after generating
      await getMySchedule();
      _setLoading(false);
      return true;
    } else {
      _setError(response.error ?? 'Lỗi khi tạo lịch rãnh');
      _setLoading(false);
      return false;
    }
  }

  // Tải lại tất cả dữ liệu
  Future<void> refreshData() async {
    await Future.wait([getCurrentJob(), getMySchedule()]);
  }

  // Helper methods
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
    notifyListeners();
  }

  // Tính thời gian còn lại đến khi hoàn thành (tính theo phút)
  int? get timeRemainingInMinutes {
    if (_currentJob?.estimatedCompletion == null) return null;

    final now = DateTime.now();
    final estimated = _currentJob!.estimatedCompletion!;
    final difference = estimated.difference(now).inMinutes;

    return difference > 0 ? difference : 0;
  }

  // Kiểm tra có quá thời gian dự kiến không
  bool get isOverdue {
    if (_currentJob?.estimatedCompletion == null) return false;
    return DateTime.now().isAfter(_currentJob!.estimatedCompletion!);
  }

  // Lấy danh sách slot rãnh trong tương lai
  List<AvailableSlot> get upcomingAvailableSlots {
    if (_schedule == null) return [];

    final now = DateTime.now();
    return _schedule!.availableSlots
        .where((slot) => !slot.isBooked && slot.startTime.isAfter(now))
        .toList()
      ..sort((a, b) => a.startTime.compareTo(b.startTime));
  }

  // Lấy slot tiếp theo
  AvailableSlot? get nextAvailableSlot {
    final upcomingSlots = upcomingAvailableSlots;
    return upcomingSlots.isNotEmpty ? upcomingSlots.first : null;
  }

  // Lấy khung giờ mặc định
  Future<ApiResponse<DefaultTimeSlots>> getDefaultTimeSlots() async {
    _setLoading(true);
    _clearError();

    final response = await _repository.getDefaultTimeSlots();

    if (!response.success) {
      _setError(response.error ?? 'Lỗi khi lấy khung giờ mặc định');
    }

    _setLoading(false);
    return response;
  }

  // Cập nhật lịch sau khi hoàn thành đơn
  Future<ApiResponse<String>> updateAvailabilityAfterBooking({
    DateTime? completedBookingTime,
    int additionalDays = 3,
  }) async {
    _setLoading(true);
    _clearError();

    final response = await _repository.updateAvailabilityAfterBooking(
      completedBookingTime: completedBookingTime,
      additionalDays: additionalDays,
    );

    if (response.success) {
      // Refresh schedule after updating
      await getMySchedule();
    } else {
      _setError(response.error ?? 'Lỗi khi cập nhật lịch khả dụng');
    }

    _setLoading(false);
    return response;
  }

  // Thợ tự cập nhật khung giờ khả dụng
  Future<ApiResponse<String>> updateCustomAvailability({
    required String date,
    required List<String> availableHours,
  }) async {
    _setLoading(true);
    _clearError();

    final response = await _repository.updateCustomAvailability(
      date: date,
      availableHours: availableHours,
    );

    if (response.success) {
      // Refresh schedule after updating
      await getMySchedule();
    } else {
      _setError(response.error ?? 'Lỗi khi cập nhật khung giờ khả dụng');
    }

    _setLoading(false);
    return response;
  }

  // Gia hạn thời gian làm việc (ẩn thêm khung giờ)
  Future<bool> extendWorkTime({
    required String bookingId,
    required int additionalHours,
  }) async {
    _setLoading(true);
    _clearError();

    final response = await _repository.extendWorkTime(
      bookingId: bookingId,
      additionalHours: additionalHours,
    );

    if (response.success) {
      // Refresh current job và schedule
      await Future.wait([getCurrentJob(), getMySchedule()]);
      _setLoading(false);
      return true;
    } else {
      _setError(response.error ?? 'Lỗi khi gia hạn thời gian làm việc');
      _setLoading(false);
      return false;
    }
  }
}
