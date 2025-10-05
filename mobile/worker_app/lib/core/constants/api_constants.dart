import '../env.dart';

class ApiConstants {
  // Base URL - lấy từ env để có thể thay đổi theo từng môi trường/devices
  static String get baseUrl => Env.apiBase;

  // Endpoints
  static const String login = '/users/login';
  static const String register = '/users/register';
  static const String profile = '/users/profile';
  static const String bookings = '/bookings';
  static const String services = '/services';
  static const String reviews = '/reviews';
  static const String schedules = '/schedules';

  // Schedule endpoints
  static const String currentJob = '/schedules/current-job';
  static const String mySchedule = '/schedules/my-schedule';
  static const String startJob = '/schedules/start-job';
  static const String updateEstimatedTime = '/schedules/update-estimated-time';
  static const String completeJob = '/schedules/complete-job';
  static const String addSlot = '/schedules/add-slot';
  static const String generateSchedule = '/schedules/generate-schedule';

  // HTTP Headers
  static const Map<String, String> defaultHeaders = {
    'Content-Type': 'application/json',
  };

  static Map<String, String> authHeaders(String token) {
    return {...defaultHeaders, 'Authorization': 'Bearer $token'};
  }
}
