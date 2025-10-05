import 'package:flutter/foundation.dart';
import '../../core/socket_service.dart';
import 'bookings_repository.dart';
import 'booking_model.dart';

class BookingsProvider with ChangeNotifier {
  final _repo = BookingsRepository();
  final _socket = SocketService();

  List<Booking> items = [];
  bool loading = false;
  String? error;
  List<String>? _activeStatuses;

  List<String>? get activeStatuses => _activeStatuses;

  bool _statusMatchesFilters(String status) {
    if (_activeStatuses == null || _activeStatuses!.isEmpty) return true;
    final lowerStatus = status.toLowerCase();
    return _activeStatuses!.any((s) => s.toLowerCase() == lowerStatus);
  }

  void _applyFiltersToUpdatedBooking(Booking updated) {
    final idx = items.indexWhere((e) => e.id == updated.id);
    final matches = _statusMatchesFilters(updated.status);
    if (idx >= 0) {
      if (matches) {
        items[idx] = updated;
      } else {
        items.removeAt(idx);
      }
    } else if (matches) {
      items = [updated, ...items];
    }
    notifyListeners();
  }

  Future<void> load({String? status, List<String>? statuses}) async {
    loading = true;
    error = null;
    if (statuses != null && statuses.isNotEmpty) {
      _activeStatuses = statuses;
    } else if (status != null) {
      _activeStatuses = [status];
    } else {
      _activeStatuses = null;
    }
    notifyListeners();
    try {
      if (statuses != null && statuses.isNotEmpty) {
        // Load multiple statuses
        List<Booking> allItems = [];
        for (String s in statuses) {
          final statusItems = await _repo.listMine(status: s);
          allItems.addAll(statusItems);
        }
        // Sort by date descending
        allItems.sort((a, b) => b.date.compareTo(a.date));
        items = allItems;
      } else {
        items = await _repo.listMine(status: status);
      }
      loading = false;
      notifyListeners();
    } catch (e) {
      error = e.toString();
      loading = false;
      notifyListeners();
    }
  }

  Future<void> loadPendingOrders() async {
    await load(status: 'pending');
  }

  void initSocket() {
    _socket.connect(
      onCreated: (json) {
        final b = Booking.fromJson(json);
        if (_statusMatchesFilters(b.status)) {
          items = [b, ...items];
          notifyListeners();
        }
      },
      onUpdated: (json) {
        final b = Booking.fromJson(json);
        _applyFiltersToUpdatedBooking(b);
      },
    );
  }

  Future<Booking> updateStatus(String id, String status) async {
    final updated = await _repo.updateStatus(id, status);
    _applyFiltersToUpdatedBooking(updated);
    onStatusChanged?.call();
    return updated;
  }

  // Callback to refresh active orders count when status changes
  void Function()? onStatusChanged;
}
