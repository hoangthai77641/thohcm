import 'package:flutter/foundation.dart';
import '../bookings/bookings_repository.dart';
import '../bookings/booking_model.dart';
import '../../core/socket_service.dart';

class CompletedOrdersProvider with ChangeNotifier {
  final _repo = BookingsRepository();
  final _socket = SocketService();

  List<Booking> _orders = [];
  bool _loading = false;
  String? _error;

  List<Booking> get orders => _orders;
  bool get loading => _loading;
  String? get error => _error;
  int get count => _orders.length;

  CompletedOrdersProvider() {
    // Auto-load completed orders when provider is created
    loadCompletedOrders();
    // Setup socket connection for real-time updates
    _initSocket();
  }

  void _initSocket() {
    _socket.connect(
      onCreated: (bookingData) {
        // New bookings won't be completed immediately
      },
      onUpdated: (bookingData) {
        // When booking is updated to done, add to completed orders
        final booking = Booking.fromJson(bookingData);
        if (booking.status == 'done') {
          // Add to completed orders if not already present
          final existingIndex = _orders.indexWhere(
            (order) => order.id == booking.id,
          );
          if (existingIndex == -1) {
            _orders.insert(0, booking); // Add to beginning
            notifyListeners();
          } else {
            // Update existing booking
            _orders[existingIndex] = booking;
            notifyListeners();
          }
        }
      },
    );
  }

  Future<void> loadCompletedOrders() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      _orders = await _repo.listMine(status: 'done');
      _loading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _loading = false;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _socket.disconnect();
    super.dispose();
  }
}
