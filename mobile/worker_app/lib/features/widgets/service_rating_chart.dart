import 'package:flutter/material.dart';
import '../widgets/star_rating_widget.dart';

class ServiceRatingChart extends StatelessWidget {
  final List<Map<String, dynamic>> services;

  const ServiceRatingChart({super.key, required this.services});

  @override
  Widget build(BuildContext context) {
    if (services.isEmpty) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Text('Chưa có dịch vụ nào'),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Đánh giá dịch vụ',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ...services
                .take(5)
                .map((service) => _buildServiceRatingBar(service)),
            if (services.length > 5)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  'và ${services.length - 5} dịch vụ khác...',
                  style: TextStyle(color: Colors.grey[600], fontSize: 12),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildServiceRatingBar(Map<String, dynamic> service) {
    final rating =
        double.tryParse(service['averageRating']?.toString() ?? '0') ?? 0;
    final reviewCount = service['reviewCount'] ?? 0;
    final serviceName = service['name'] ?? '';

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  serviceName,
                  style: const TextStyle(fontWeight: FontWeight.w500),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Text(
                '$rating',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.amber,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              StarRatingWidget(rating: rating, size: 16),
              const SizedBox(width: 8),
              Expanded(
                child: LinearProgressIndicator(
                  value: rating / 5,
                  backgroundColor: Colors.grey[300],
                  valueColor: AlwaysStoppedAnimation<Color>(
                    rating >= 4.0
                        ? Colors.green
                        : rating >= 3.0
                        ? Colors.orange
                        : Colors.red,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '($reviewCount)',
                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
