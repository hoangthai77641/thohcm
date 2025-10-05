import 'package:flutter/foundation.dart';
import 'worker_stats_repository.dart';

class WorkerStatsProvider extends ChangeNotifier {
  final _repo = WorkerStatsRepository();
  WorkerStats? stats;
  bool loading = false;
  String? error;
  String selectedTimeRange = 'today'; // 'today', 'week', 'month', 'all'

  Future<void> load() async {
    try {
      loading = true;
      error = null;
      notifyListeners();
      stats = await _repo.fetch(timeRange: selectedTimeRange);
    } catch (e) {
      error = e.toString();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  void setTimeRange(String range) {
    if (selectedTimeRange != range) {
      selectedTimeRange = range;
      load();
    }
  }
}
