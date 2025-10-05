import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/providers/review_provider.dart';
import '../../core/models/review.dart';
import '../widgets/star_rating_widget.dart';

class MyReviewsScreen extends StatefulWidget {
  const MyReviewsScreen({Key? key}) : super(key: key);

  @override
  State<MyReviewsScreen> createState() => _MyReviewsScreenState();
}

class _MyReviewsScreenState extends State<MyReviewsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadMyReviews();
    });
  }

  void _loadMyReviews() {
    context.read<ReviewProvider>().getMyServiceReviews();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Đánh giá dịch vụ của tôi'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: Consumer<ReviewProvider>(
        builder: (context, reviewProvider, child) {
          if (reviewProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (reviewProvider.myReviews.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.star_border, size: 80, color: Colors.grey),
                  SizedBox(height: 16),
                  Text(
                    'Chưa có đánh giá nào',
                    style: TextStyle(fontSize: 18, color: Colors.grey),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Hoàn thành dịch vụ để nhận đánh giá từ khách hàng',
                    style: TextStyle(color: Colors.grey),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            );
          }

          // Group reviews by service
          Map<String, List<Review>> reviewsByService = {};
          for (var review in reviewProvider.myReviews) {
            String serviceKey =
                review.service?.name ?? 'Dịch vụ không xác định';
            if (!reviewsByService.containsKey(serviceKey)) {
              reviewsByService[serviceKey] = [];
            }
            reviewsByService[serviceKey]!.add(review);
          }

          return RefreshIndicator(
            onRefresh: () async => _loadMyReviews(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: reviewsByService.length,
              itemBuilder: (context, index) {
                String serviceName = reviewsByService.keys.elementAt(index);
                List<Review> serviceReviews = reviewsByService[serviceName]!;

                // Calculate average rating for this service
                double avgRating =
                    serviceReviews.fold(
                      0.0,
                      (sum, review) => sum + review.rating,
                    ) /
                    serviceReviews.length;

                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Service name and average rating
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                serviceName,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            Column(
                              children: [
                                StarRatingWidget(rating: avgRating, size: 20),
                                Text(
                                  '${avgRating.toStringAsFixed(1)}/5',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '${serviceReviews.length} đánh giá',
                          style: const TextStyle(
                            color: Colors.grey,
                            fontSize: 14,
                          ),
                        ),
                        const Divider(height: 20),

                        // Individual reviews
                        ...serviceReviews.map(
                          (review) => _buildReviewItem(review),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildReviewItem(Review review) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                review.customer?.name ?? 'Khách hàng',
                style: const TextStyle(
                  fontWeight: FontWeight.w500,
                  fontSize: 14,
                ),
              ),
              Text(
                _formatDate(review.createdAt),
                style: const TextStyle(color: Colors.grey, fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 4),
          StarRatingWidget(rating: review.rating.toDouble(), size: 16),
          if (review.comment.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(review.comment, style: const TextStyle(fontSize: 14)),
          ],
        ],
      ),
    );
  }

  String _formatDate(DateTime dateTime) {
    return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
  }
}
