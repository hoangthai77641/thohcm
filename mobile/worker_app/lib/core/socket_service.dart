import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:shared_preferences/shared_preferences.dart';
import 'env.dart';
import 'services/notification_service.dart';

typedef BookingListener = void Function(Map<String, dynamic> bookingJson);

class SocketService {
  IO.Socket? _socket;
  static Function()? onNewOrderCallback;

  void connect({
    BookingListener? onCreated,
    BookingListener? onUpdated,
    BookingListener? onLoyalty,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final userStr = prefs.getString('me');
    if (userStr == null) return;
    // Parse minimal fields
    final workerId = RegExp(
      r'"_id"\s*:\s*"([^"]+)"',
    ).firstMatch(userStr)?.group(1);
    if (workerId == null) return;

    _socket = IO.io(
      Env.socketBase,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setExtraHeaders({
            if (token != null) 'Authorization': 'Bearer $token',
          })
          .build(),
    );

    _socket!.onConnect((_) {
      // Join room by workerId string to match backend server.js
      _socket!.emit('join', workerId);
    });

    if (onCreated != null) {
      _socket!.on('bookingCreated', (data) {
        if (data is Map) {
          final booking = Map<String, dynamic>.from(data);
          onCreated(booking);

          // Show notification for new order
          _showNewOrderNotification(booking);

          // Trigger in-app notification
          if (onNewOrderCallback != null) {
            onNewOrderCallback!();
          }
        }
      });
    }
    if (onUpdated != null) {
      _socket!.on('bookingUpdated', (data) {
        if (data is Map) onUpdated(Map<String, dynamic>.from(data));
      });
    }
    if (onLoyalty != null) {
      _socket!.on('loyaltyUpdated', (data) {
        if (data is Map) onLoyalty(Map<String, dynamic>.from(data));
      });
    }

    _socket!.connect();
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }

  void _showNewOrderNotification(Map<String, dynamic> booking) {
    final customer = booking['customer'] as Map<String, dynamic>?;
    final service = booking['service'] as Map<String, dynamic>?;

    final customerName = customer?['name'] ?? 'Khách hàng';
    final serviceName = service?['name'] ?? 'Dịch vụ';
    final orderId = booking['_id'] ?? '';

    NotificationService().showNewOrderNotification(
      customerName: customerName,
      serviceName: serviceName,
      orderId: orderId,
    );
  }
}
