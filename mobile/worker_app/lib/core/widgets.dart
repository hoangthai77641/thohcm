import 'package:flutter/material.dart';
import '../core/app_theme.dart';

/// Status Badge Widget - Matches web design
class StatusBadge extends StatelessWidget {
  final String status;
  final double? fontSize;
  final EdgeInsetsGeometry? padding;

  const StatusBadge({
    super.key,
    required this.status,
    this.fontSize,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    final color = AppTheme.getStatusColor(status);
    final text = AppTheme.getStatusText(status);

    return Container(
      padding:
          padding ?? const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: Colors.white,
          fontSize: fontSize ?? 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

/// Booking Card Widget - Matches web list design
class BookingCard extends StatelessWidget {
  final Map<String, dynamic> booking;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;
  final Widget? trailing;
  final bool expanded;
  final VoidCallback? onToggle;

  const BookingCard({
    super.key,
    required this.booking,
    this.onTap,
    this.onLongPress,
    this.trailing,
    this.expanded = true,
    this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    final service = booking['service'] as Map<String, dynamic>?;
    final customer = booking['customer'] as Map<String, dynamic>?;
    final worker = booking['worker'] as Map<String, dynamic>?;

    final serviceName = service?['name'] ?? 'Dịch vụ';
    final customerName = customer?['name'] ?? '';
    final customerPhone = customer?['phone'] ?? '';
    final customerAddress = customer?['address'] ?? booking['address'] ?? '';
    final workerName = worker?['name'] ?? '';
    final status = booking['status'] ?? 'pending';
    final note = booking['note'] ?? '';
    final finalPrice = booking['finalPrice'];

    // Parse date
    DateTime? date;
    if (booking['date'] != null) {
      try {
        date = DateTime.parse(booking['date'].toString()).toLocal();
      } catch (e) {
        // Handle date parsing error
      }
    }

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: InkWell(
        onTap: onToggle ?? onTap,
        onLongPress: onLongPress ?? (onToggle != null ? onTap : null),
        borderRadius: BorderRadius.circular(AppTheme.radius),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Row
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          serviceName,
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.bold),
                        ),
                        if (date != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            _formatDate(date),
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(
                                  color: Theme.of(
                                    context,
                                  ).colorScheme.onSurfaceVariant,
                                ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  StatusBadge(status: status),
                  if (trailing != null) ...[
                    const SizedBox(width: 8),
                    trailing!,
                  ],
                  if (onToggle != null) ...[
                    const SizedBox(width: 4),
                    IconButton(
                      icon: AnimatedRotation(
                        turns: expanded ? 0 : 0.5,
                        duration: const Duration(milliseconds: 200),
                        child: const Icon(Icons.expand_more),
                      ),
                      onPressed: onToggle,
                      visualDensity: VisualDensity.compact,
                    ),
                  ],
                ],
              ),

              AnimatedCrossFade(
                firstChild: const SizedBox(height: 0),
                secondChild: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 12),
                    if (customerName.isNotEmpty) ...[
                      _buildInfoRow(
                        context,
                        icon: Icons.person,
                        label: 'Khách hàng',
                        value: customerName,
                      ),
                      const SizedBox(height: 8),
                    ],
                    if (customerPhone.isNotEmpty) ...[
                      _buildInfoRow(
                        context,
                        icon: Icons.phone,
                        label: 'SĐT',
                        value: customerPhone,
                        isClickable: true,
                      ),
                      const SizedBox(height: 8),
                    ],
                    if (customerAddress.isNotEmpty) ...[
                      _buildInfoRow(
                        context,
                        icon: Icons.location_on,
                        label: 'Địa chỉ',
                        value: customerAddress,
                      ),
                      const SizedBox(height: 8),
                    ],
                    if (workerName.isNotEmpty) ...[
                      _buildInfoRow(
                        context,
                        icon: Icons.build,
                        label: 'Thợ',
                        value: workerName,
                      ),
                      const SizedBox(height: 8),
                    ],
                    if (finalPrice != null) ...[
                      _buildInfoRow(
                        context,
                        icon: Icons.payments,
                        label: 'Giá',
                        value: '${_formatPrice(finalPrice)} ₫',
                        valueStyle: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],
                    if (note.isNotEmpty)
                      _buildInfoRow(
                        context,
                        icon: Icons.note,
                        label: 'Ghi chú',
                        value: note,
                      ),
                  ],
                ),
                crossFadeState: expanded
                    ? CrossFadeState.showSecond
                    : CrossFadeState.showFirst,
                duration: const Duration(milliseconds: 200),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String value,
    bool isClickable = false,
    TextStyle? valueStyle,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(
          icon,
          size: 16,
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        ),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
            fontWeight: FontWeight.w500,
          ),
        ),
        Expanded(
          child: Text(
            value,
            style:
                valueStyle ??
                Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: isClickable
                      ? Theme.of(context).colorScheme.primary
                      : Theme.of(context).colorScheme.onSurface,
                  decoration: isClickable ? TextDecoration.underline : null,
                ),
          ),
        ),
      ],
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year} '
        '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }

  String _formatPrice(dynamic price) {
    if (price is num) {
      return price.toInt().toString().replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
        (Match m) => '${m[1]}.',
      );
    }
    return price.toString();
  }
}

/// Simple List Item Widget - For simpler displays
class SimpleListItem extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? leading;
  final Widget? trailing;
  final VoidCallback? onTap;

  const SimpleListItem({
    super.key,
    required this.title,
    this.subtitle,
    this.leading,
    this.trailing,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ListTile(
        leading: leading,
        title: Text(title),
        subtitle: subtitle != null ? Text(subtitle!) : null,
        trailing: trailing,
        onTap: onTap,
      ),
    );
  }
}
