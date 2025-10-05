import 'package:dio/dio.dart';
import '../../core/api_client.dart';

class WorkerStats {
  final int incomeToday;
  final int incomeMonth;
  final int incomeTotal;
  final Map<String, int> bookingsByStatus;
  final int servicesTotal;
  final int servicesActive;
  final int servicesInactive;

  WorkerStats({
    required this.incomeToday,
    required this.incomeMonth,
    required this.incomeTotal,
    required this.bookingsByStatus,
    required this.servicesTotal,
    required this.servicesActive,
    required this.servicesInactive,
  });

  factory WorkerStats.fromJson(Map<String, dynamic> json) {
    final income = json['income'] ?? {};
    final b = Map<String, dynamic>.from(json['bookingsByStatus'] ?? {});
    return WorkerStats(
      incomeToday: (income['today'] ?? 0) as int,
      incomeMonth: (income['month'] ?? 0) as int,
      incomeTotal: (income['total'] ?? 0) as int,
      bookingsByStatus: b.map((k, v) => MapEntry(k, (v ?? 0) as int)),
      servicesTotal: (json['services']?['total'] ?? 0) as int,
      servicesActive: (json['services']?['active'] ?? 0) as int,
      servicesInactive: (json['services']?['inactive'] ?? 0) as int,
    );
  }
}

class WorkerStatsRepository {
  final Dio _client = ApiClient().dio;

  Future<WorkerStats> fetch({String? timeRange}) async {
    final params = timeRange != null
        ? {'range': timeRange}
        : <String, dynamic>{};
    final r = await _client.get(
      '/api/bookings/stats/worker',
      queryParameters: params,
    );
    return WorkerStats.fromJson(r.data as Map<String, dynamic>);
  }
}
