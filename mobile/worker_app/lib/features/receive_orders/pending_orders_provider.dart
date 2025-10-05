import 'package:flutter/foundation.dart';
import '../bookings/bookings_repository.dart';
import '../bookings/booking_model.dart';
import '../../core/socket_service.dart';

class PendingOrdersProvider with ChangeNotifier {
  final _repo = BookingsRepository();
  final _socket = SocketService();

  List<Booking> _orders = [];
  bool _loading = false;
  String? _error;

  List<Booking> get orders => _orders;
  bool get loading => _loading;
  String? get error => _error;
  int get count => _orders.length;

  PendingOrdersProvider() {
    // Auto-load pending orders when provider is created
    loadPendingOrders();
    // Setup socket connection for real-time updates
    _initSocket();
  }

  void _initSocket() {
    _socket.connect(
      onCreated: (bookingData) {
        // When new booking is created, add it to pending orders if it's pending
        final booking = Booking.fromJson(bookingData);
        if (booking.status == 'pending') {
          _orders.insert(0, booking); // Add to beginning of list
          notifyListeners();
        }
      },
      onUpdated: (bookingData) {
        // When booking is updated, remove it from pending if no longer pending
        final booking = Booking.fromJson(bookingData);
        if (booking.status != 'pending') {
          removeOrder(booking.id);
        }
      },
    );
  }

  Future<void> loadPendingOrders() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      _orders = await _repo.listMine(status: 'pending');
      _loading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _loading = false;
      notifyListeners();
    }
  }

  void removeOrder(String orderId) {
    _orders.removeWhere((order) => order.id == orderId);
    notifyListeners();
  }

  @override
  void dispose() {
    _socket.disconnect();
    super.dispose();
  }
}
