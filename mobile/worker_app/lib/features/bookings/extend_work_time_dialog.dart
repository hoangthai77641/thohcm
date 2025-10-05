import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/services/token_service.dart';
import '../../core/constants/api_constants.dart';

class ExtendWorkTimeDialog extends StatefulWidget {
  final String bookingId;
  final DateTime currentEndTime;

  const ExtendWorkTimeDialog({
    Key? key,
    required this.bookingId,
    required this.currentEndTime,
  }) : super(key: key);

  @override
  State<ExtendWorkTimeDialog> createState() => _ExtendWorkTimeDialogState();
}

class _ExtendWorkTimeDialogState extends State<ExtendWorkTimeDialog> {
  int selectedHours = 1;
  final List<int> availableHours = [1, 2, 3, 4, 5];
  bool isLoading = false;
  final TokenService _tokenService = TokenService();

  Future<bool> _extendWorkTime({
    required String bookingId,
    required int additionalHours,
  }) async {
    setState(() {
      isLoading = true;
    });

    try {
      final token = await _tokenService.getToken();
      if (token == null) {
        print('No token found');
        return false;
      }

      print(
        'Extending work time for booking: $bookingId, hours: $additionalHours',
      );
      final url = '${ApiConstants.baseUrl}/api/schedules/extend-work-time';

      print('Using URL: $url');

      final response = await http.post(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'bookingId': bookingId,
          'additionalHours': additionalHours,
        }),
      );

      print('Extend work time response: ${response.statusCode}');
      print('Response body: ${response.body}');

      if (response.statusCode == 200) {
        return true;
      } else {
        print('API error: ${response.statusCode} - ${response.body}');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Lỗi: ${response.statusCode}'),
              backgroundColor: Colors.red,
            ),
          );
        }
        return false;
      }
    } catch (e) {
      print('Error extending work time: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi kết nối: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
      return false;
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text(
        'Gia hạn thời gian làm việc',
        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Chọn số giờ cần gia hạn thêm:',
            style: TextStyle(fontSize: 16),
          ),
          const SizedBox(height: 16),
          const Text(
            'Số giờ gia hạn:',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: availableHours.map((hours) {
              final isSelected = selectedHours == hours;
              return ChoiceChip(
                label: Text('$hours giờ'),
                selected: isSelected,
                onSelected: (selected) {
                  if (selected) {
                    setState(() {
                      selectedHours = hours;
                    });
                  }
                },
                selectedColor: Colors.blue.shade100,
                backgroundColor: Colors.grey.shade200,
                labelStyle: TextStyle(
                  color: isSelected
                      ? Colors.blue.shade700
                      : Colors.grey.shade700,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.orange.shade50,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.orange.shade200),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.warning_amber_rounded,
                  color: Colors.orange.shade600,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Các khung giờ tiếp theo sẽ bị ẩn trên web khách',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.orange.shade700,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Hủy'),
        ),
        ElevatedButton(
          onPressed: isLoading
              ? null
              : () async {
                  final success = await _extendWorkTime(
                    bookingId: widget.bookingId,
                    additionalHours: selectedHours,
                  );

                  if (success && mounted) {
                    Navigator.of(context).pop(true);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Đã gia hạn thêm $selectedHours giờ'),
                        backgroundColor: Colors.green,
                      ),
                    );
                  }
                },
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.blue,
            foregroundColor: Colors.white,
          ),
          child: isLoading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              : const Text('Xác nhận'),
        ),
      ],
    );
  }
}
