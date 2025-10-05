import 'package:flutter/foundation.dart';
import 'bookings_repository.dart';
import 'booking_model.dart';
import '../../core/socket_service.dart';

class ActiveOrdersProvider with ChangeNotifier {
  final _repo = BookingsRepository();
  final _socket = SocketService();

  List<Booking> _orders = [];
  bool _loading = false;
  String? _error;

  List<Booking> get orders => _orders;
  bool get loading => _loading;
  String? get error => _error;
  int get count => _orders.length;

  ActiveOrdersProvider() {
    // Auto-load active orders when provider is created
    loadActiveOrders();
    // Setup socket connection for real-time updates
    _initSocket();
  }

  void _initSocket() {
    _socket.connect(
      onCreated: (bookingData) {
        // When new booking is created, it won't be confirmed yet so no need to add
        // But we reload anyway to be safe
        loadActiveOrders();
      },
      onUpdated: (bookingData) {
        // When booking is updated, check if it's now confirmed or no longer confirmed
        final booking = Booking.fromJson(bookingData);
        if (booking.status == 'confirmed') {
          // Add to active orders if not already there
          if (!_orders.any((order) => order.id == booking.id)) {
            _orders.insert(0, booking);
            notifyListeners();
          }
        } else {
          // Remove from active orders if status changed
          _orders.removeWhere((order) => order.id == booking.id);
          notifyListeners();
        }
      },
    );
  }

  Future<void> loadActiveOrders() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      _orders = await _repo.listMine(status: 'confirmed');
      _loading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _loading = false;
      notifyListeners();
    }
  }

  void addOrder(Booking order) {
    if (order.status == 'confirmed' && !_orders.any((o) => o.id == order.id)) {
      _orders.insert(0, order);
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
