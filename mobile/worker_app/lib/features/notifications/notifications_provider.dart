import 'package:flutter/foundation.dart';
import '../notifications/notifications_screen.dart';

class NotificationsProvider extends ChangeNotifier {
  List<NotificationItem> _notifications = [];
  int _unreadCount = 0;

  List<NotificationItem> get notifications => _notifications;
  int get unreadCount => _unreadCount;

  void addNotification(NotificationItem notification) {
    _notifications.insert(0, notification);
    if (!notification.isRead) {
      _unreadCount++;
    }
    notifyListeners();
  }

  void addNotificationFromSocket(Map<String, dynamic> data) {
    final notification = NotificationItem(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      title: data['title'] ?? 'Thông báo',
      message: data['message'] ?? '',
      type: data['type'] ?? 'info',
      timestamp: data['timestamp'] != null
          ? DateTime.parse(data['timestamp'])
          : DateTime.now(),
      isRead: false,
      data: data['data'],
    );

    addNotification(notification);
  }

  void markAsRead(String notificationId) {
    final index = _notifications.indexWhere((n) => n.id == notificationId);
    if (index != -1 && !_notifications[index].isRead) {
      _notifications[index] = _notifications[index].copyWith(isRead: true);
      _unreadCount--;
      notifyListeners();
    }
  }

  void markAllAsRead() {
    bool hasChanges = false;
    for (int i = 0; i < _notifications.length; i++) {
      if (!_notifications[i].isRead) {
        _notifications[i] = _notifications[i].copyWith(isRead: true);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      _unreadCount = 0;
      notifyListeners();
    }
  }

  void clearAll() {
    _notifications.clear();
    _unreadCount = 0;
    notifyListeners();
  }

  void loadSampleData() {
    _notifications = [
      NotificationItem(
        id: '1',
        title: 'Chào mừng!',
        message: 'Chào mừng bạn đến với ứng dụng Thợ HCM',
        type: 'system',
        timestamp: DateTime.now().subtract(const Duration(hours: 1)),
        isRead: false,
      ),
    ];
    _unreadCount = 1;
    notifyListeners();
  }
}
