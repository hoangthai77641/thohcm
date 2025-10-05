import 'package:flutter/foundation.dart';
import '../bookings/bookings_repository.dart';
import '../bookings/booking_model.dart';
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
    // Auto-load confirmed orders when provider is created
    loadActiveOrders();
    // Setup socket connection for real-time updates
    _initSocket();
  }

  void _initSocket() {
    _socket.connect(
      onCreated: (bookingData) {
        // When new booking is created, it won't be active immediately
        // Only add when status becomes 'confirmed'
      },
      onUpdated: (bookingData) {
        // When booking is updated, add or remove from active orders
        final booking = Booking.fromJson(bookingData);
        if (booking.status == 'confirmed') {
          // Add to active orders if not already present
          final existingIndex = _orders.indexWhere(
            (order) => order.id == booking.id,
          );
          if (existingIndex == -1) {
            _orders.insert(0, booking);
            notifyListeners();
          }
        } else {
          // Remove from active orders if status changed away from confirmed
          removeOrder(booking.id);
        }
      },
    );
  }

  Future<void> loadActiveOrders() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      // Load both confirmed (working on) orders
      _orders = await _repo.listMine(status: 'confirmed');
      _loading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _loading = false;
      notifyListeners();
    }
  }

  // Manual refresh method to force reload active orders
  Future<void> refresh() async {
    await loadActiveOrders();
  }

  void addOrder(Booking booking) {
    if (booking.status == 'confirmed') {
      _orders.removeWhere((order) => order.id == booking.id);
      _orders.insert(0, booking);
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
