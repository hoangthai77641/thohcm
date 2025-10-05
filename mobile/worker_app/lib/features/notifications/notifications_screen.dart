import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'notifications_provider.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    // Load sample data if empty
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<NotificationsProvider>();
      if (provider.notifications.isEmpty) {
        provider.loadSampleData();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Consumer<NotificationsProvider>(
      builder: (context, provider, child) {
        return Scaffold(
          appBar: AppBar(
            title: Row(
              children: [
                const Text('Thông báo'),
                if (provider.unreadCount > 0) ...[
                  const SizedBox(width: 8),
                  Badge(
                    label: Text(provider.unreadCount.toString()),
                    child: const SizedBox.shrink(),
                  ),
                ],
              ],
            ),
            backgroundColor: colorScheme.surface,
            elevation: 0,
            actions: [
              IconButton(
                icon: const Icon(Icons.mark_email_read_outlined),
                onPressed: () => provider.markAllAsRead(),
                tooltip: 'Đánh dấu tất cả đã đọc',
              ),
            ],
          ),
          body: provider.notifications.isEmpty
              ? _buildEmptyState(colorScheme)
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: provider.notifications.length,
                  itemBuilder: (context, index) {
                    final notification = provider.notifications[index];
                    return _buildNotificationCard(
                      notification,
                      colorScheme,
                      () => provider.markAsRead(notification.id),
                    );
                  },
                ),
        );
      },
    );
  }

  Widget _buildEmptyState(ColorScheme colorScheme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.notifications_none_outlined,
            size: 64,
            color: colorScheme.onSurfaceVariant,
          ),
          const SizedBox(height: 16),
          Text(
            'Chưa có thông báo nào',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w500,
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Các thông báo mới sẽ xuất hiện ở đây',
            style: TextStyle(
              fontSize: 14,
              color: colorScheme.onSurfaceVariant.withOpacity(0.7),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationCard(
    NotificationItem notification,
    ColorScheme colorScheme,
    VoidCallback onTap,
  ) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: notification.isRead ? 1 : 3,
      color: notification.isRead
          ? colorScheme.surface
          : colorScheme.primaryContainer.withOpacity(0.1),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Icon thông báo
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: _getNotificationColor(
                    notification.type,
                  ).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Icon(
                  _getNotificationIcon(notification.type),
                  color: _getNotificationColor(notification.type),
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              // Nội dung thông báo
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            notification.title,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: notification.isRead
                                  ? FontWeight.w500
                                  : FontWeight.w600,
                              color: colorScheme.onSurface,
                            ),
                          ),
                        ),
                        if (!notification.isRead)
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: colorScheme.primary,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      notification.message,
                      style: TextStyle(
                        fontSize: 14,
                        color: colorScheme.onSurfaceVariant,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _formatTimestamp(notification.timestamp),
                      style: TextStyle(
                        fontSize: 12,
                        color: colorScheme.onSurfaceVariant.withOpacity(0.7),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  IconData _getNotificationIcon(String type) {
    switch (type) {
      case 'job_assignment':
        return Icons.work_outline;
      case 'system':
        return Icons.settings_outlined;
      case 'promotion':
        return Icons.local_offer_outlined;
      case 'warning':
        return Icons.warning_amber_outlined;
      case 'info':
        return Icons.info_outline;
      default:
        return Icons.notifications_outlined;
    }
  }

  Color _getNotificationColor(String type) {
    switch (type) {
      case 'job_assignment':
        return Colors.blue;
      case 'system':
        return Colors.grey;
      case 'promotion':
        return Colors.purple;
      case 'warning':
        return Colors.orange;
      case 'error':
        return Colors.red;
      case 'success':
        return Colors.green;
      default:
        return Colors.blue;
    }
  }

  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);

    if (difference.inMinutes < 1) {
      return 'Vừa xong';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes} phút trước';
    } else if (difference.inHours < 24) {
      return '${difference.inHours} giờ trước';
    } else if (difference.inDays == 1) {
      return 'Hôm qua';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} ngày trước';
    } else {
      return DateFormat('dd/MM/yyyy HH:mm').format(timestamp);
    }
  }
}

class NotificationItem {
  final String id;
  final String title;
  final String message;
  final String type;
  final DateTime timestamp;
  final bool isRead;
  final Map<String, dynamic>? data;

  const NotificationItem({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.timestamp,
    required this.isRead,
    this.data,
  });

  NotificationItem copyWith({
    String? id,
    String? title,
    String? message,
    String? type,
    DateTime? timestamp,
    bool? isRead,
    Map<String, dynamic>? data,
  }) {
    return NotificationItem(
      id: id ?? this.id,
      title: title ?? this.title,
      message: message ?? this.message,
      type: type ?? this.type,
      timestamp: timestamp ?? this.timestamp,
      isRead: isRead ?? this.isRead,
      data: data ?? this.data,
    );
  }
}
