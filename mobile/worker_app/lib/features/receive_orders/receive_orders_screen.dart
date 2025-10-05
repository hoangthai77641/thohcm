import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../bookings/bookings_provider.dart';
import '../bookings/booking_model.dart';
import 'active_orders_provider.dart';
import 'pending_orders_provider.dart';

class ReceiveOrdersScreen extends StatefulWidget {
  const ReceiveOrdersScreen({super.key});

  @override
  State<ReceiveOrdersScreen> createState() => _ReceiveOrdersScreenState();
}

class _ReceiveOrdersScreenState extends State<ReceiveOrdersScreen> {
  final Set<String> _expandedOrderIds = {};
  final Set<String> _processingOrderIds = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Load only pending orders (orders waiting for worker confirmation)
      context.read<PendingOrdersProvider>().loadPendingOrders();
    });
  }

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<PendingOrdersProvider>();
    final bookingsProv = context.watch<BookingsProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Nhận đơn'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => prov.loadPendingOrders(),
          ),
        ],
      ),
      body: prov.loading
          ? const Center(child: CircularProgressIndicator())
          : prov.orders.isEmpty
          ? _buildEmptyState()
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: prov.orders.length,
              itemBuilder: (ctx, i) {
                final booking = prov.orders[i];
                return _buildOrderCard(booking, bookingsProv);
              },
            ),
    );
  }

  Widget _buildEmptyState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.inbox_outlined, size: 64, color: Colors.grey),
          SizedBox(height: 16),
          Text(
            'Không có đơn hàng mới',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500),
          ),
          SizedBox(height: 8),
          Text(
            'Các đơn hàng mới sẽ xuất hiện ở đây',
            style: TextStyle(color: Colors.grey),
          ),
        ],
      ),
    );
  }

  void _toggleOrderDetails(String orderId) {
    setState(() {
      if (_expandedOrderIds.contains(orderId)) {
        _expandedOrderIds.remove(orderId);
      } else {
        _expandedOrderIds.add(orderId);
      }
    });
  }

  Widget _buildOrderCard(Booking booking, BookingsProvider prov) {
    final customerName = booking.customer?['name'] ?? 'Khách hàng';
    final customerPhone = booking.customer?['phone'] ?? '';
    final customerAddress = booking.customer?['address'] ?? '';
    final serviceName = booking.service?['name'] ?? 'Dịch vụ';
    final servicePrice =
        booking.finalPrice?.toString() ??
        booking.service?['basePrice']?.toString() ??
        '0';

    const double buttonHeight = 56;
    final bool isExpanded = _expandedOrderIds.contains(booking.id);
    final bool isProcessing = _processingOrderIds.contains(booking.id);

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Service info
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        serviceName,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '$servicePrice VND',
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.green[600],
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.orange[100],
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    'Đơn mới',
                    style: TextStyle(
                      color: Colors.orange[800],
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 8),
            TextButton.icon(
              onPressed: () => _toggleOrderDetails(booking.id),
              icon: Icon(isExpanded ? Icons.expand_less : Icons.expand_more),
              label: Text(
                isExpanded ? 'Thu gọn thông tin' : 'Chi tiết đơn hàng',
              ),
              style: TextButton.styleFrom(
                padding: EdgeInsets.zero,
                alignment: Alignment.centerLeft,
              ),
            ),

            AnimatedCrossFade(
              firstChild: const SizedBox.shrink(),
              secondChild: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Divider(height: 24),
                  _buildInfoRow(Icons.person, 'Khách hàng', customerName),
                  if (customerPhone.isNotEmpty)
                    _buildInfoRow(Icons.phone, 'Điện thoại', customerPhone),
                  _buildInfoRow(Icons.location_on, 'Địa chỉ', customerAddress),
                  _buildInfoRow(
                    Icons.schedule,
                    'Thời gian',
                    _formatDateTime(booking.date),
                  ),
                  if (booking.note?.isNotEmpty == true) ...[
                    const SizedBox(height: 8),
                    _buildInfoRow(Icons.note, 'Ghi chú', booking.note!),
                  ],
                  const SizedBox(height: 16),
                ],
              ),
              crossFadeState: isExpanded
                  ? CrossFadeState.showSecond
                  : CrossFadeState.showFirst,
              duration: const Duration(milliseconds: 200),
            ),

            // Action buttons
            Row(
              children: [
                if (customerPhone.isNotEmpty) ...[
                  Expanded(
                    child: SizedBox(
                      height: buttonHeight,
                      child: _buildCallButton(
                        customerPhone,
                        height: buttonHeight,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                ],
                Expanded(
                  flex: 2,
                  child: SizedBox(
                    height: buttonHeight,
                    child: ElevatedButton.icon(
                      onPressed: isProcessing
                          ? null
                          : () => _confirmOrder(booking, prov),
                      icon: isProcessing
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  Colors.white,
                                ),
                              ),
                            )
                          : const Icon(Icons.check, size: 18),
                      label: Text(isProcessing ? 'Đang xử lý...' : 'Nhận đơn'),
                      style: ElevatedButton.styleFrom(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(18),
                        ),
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: Colors.grey[600]),
          const SizedBox(width: 8),
          Text(
            '$label: ',
            style: TextStyle(
              fontWeight: FontWeight.w500,
              color: Colors.grey[700],
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w400),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCallButton(String phoneNumber, {double height = 56}) {
    return InkWell(
      onTap: () => _makePhoneCall(phoneNumber),
      borderRadius: BorderRadius.circular(18),
      child: Ink(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF2E7FFB), Color(0xFF53C6FF)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.15),
              blurRadius: 10,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: SizedBox(
          height: height,
          child: const Center(
            child: Icon(Icons.phone_in_talk, color: Colors.white, size: 24),
          ),

        ),
      ),
    );
  }

  String _formatDateTime(DateTime date) {
    return '${date.day}/${date.month}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }

  Future<void> _makePhoneCall(String phoneNumber) async {
    final uri = Uri(scheme: 'tel', path: phoneNumber);
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Không thể thực hiện cuộc gọi')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Lỗi khi thực hiện cuộc gọi')),
        );
      }
    }
  }

  Future<void> _confirmOrder(
    Booking booking,
    BookingsProvider bookingsProvider,
  ) async {
    final pendingOrdersProvider = context.read<PendingOrdersProvider>();
    final activeOrdersProvider = context.read<ActiveOrdersProvider>();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xác nhận nhận đơn'),
        content: Text(
          'Bạn có chắc chắn muốn nhận đơn "${booking.service?['name'] ?? 'này'}"?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Xác nhận'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      if (mounted) {
        setState(() {
          _processingOrderIds.add(booking.id);
        });
      }

      try {
        await bookingsProvider.updateStatus(booking.id, 'confirmed');
        if (!mounted) return;

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đã nhận đơn thành công!'),
            backgroundColor: Colors.green,
          ),
        );

        pendingOrdersProvider.removeOrder(booking.id);

        final confirmedBooking = booking.copyWith(status: 'confirmed');
        activeOrdersProvider.addOrder(confirmedBooking);

        await Future.wait([
          activeOrdersProvider.refresh(),
          pendingOrdersProvider.loadPendingOrders(),
        ]);

        bookingsProvider.load(statuses: ['confirmed']);
      } catch (e) {
        if (!mounted) return;

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      } finally {
        if (mounted) {
          setState(() {
            _processingOrderIds.remove(booking.id);
          });
        }
      }
    }
  }
}
