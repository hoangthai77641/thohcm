import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'review_provider.dart';
import 'star_rating_widget.dart';
import 'review_form_screen.dart';
import '../auth/auth_provider.dart';

class ReviewListScreen extends StatefulWidget {
  final String serviceId;
  final String serviceName;

  const ReviewListScreen({
    Key? key,
    required this.serviceId,
    required this.serviceName,
  }) : super(key: key);

  @override
  State<ReviewListScreen> createState() => _ReviewListScreenState();
}

class _ReviewListScreenState extends State<ReviewListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ReviewProvider>().loadReviewsForService(widget.serviceId);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Đánh giá - ${widget.serviceName}'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: Consumer<ReviewProvider>(
        builder: (context, reviewProvider, child) {
          if (reviewProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (reviewProvider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
                  const SizedBox(height: 16),
                  Text(
                    'Không thể tải đánh giá',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    reviewProvider.error!,
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      reviewProvider.clearError();
                      reviewProvider.loadReviewsForService(widget.serviceId);
                    },
                    child: const Text('Thử lại'),
                  ),
                ],
              ),
            );
          }

          final reviews = reviewProvider.reviews;
          final averageRating = reviewProvider.averageRating;

          return Column(
            children: [
              // Summary header
              if (reviews.isNotEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  color: Colors.blue[50],
                  child: Column(
                    children: [
                      Text(
                        averageRating.toStringAsFixed(1),
                        style: const TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: Colors.blue,
                        ),
                      ),
                      const SizedBox(height: 8),
                      StarRating(rating: averageRating, size: 24),
                      const SizedBox(height: 8),
                      Text(
                        '${reviews.length} đánh giá',
                        style: TextStyle(color: Colors.grey[600], fontSize: 16),
                      ),
                    ],
                  ),
                ),

              // Reviews list
              Expanded(
                child: reviews.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.rate_review_outlined,
                              size: 64,
                              color: Colors.grey[400],
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'Chưa có đánh giá nào',
                              style: Theme.of(context).textTheme.headlineSmall
                                  ?.copyWith(color: Colors.grey[600]),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Hãy là người đầu tiên đánh giá dịch vụ này!',
                              style: TextStyle(color: Colors.grey[500]),
                            ),
                          ],
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: reviews.length,
                        separatorBuilder: (context, index) =>
                            const Divider(height: 24),
                        itemBuilder: (context, index) {
                          final review = reviews[index];
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  CircleAvatar(
                                    backgroundColor: Colors.blue,
                                    child: Text(
                                      review.customerName.isNotEmpty
                                          ? review.customerName[0].toUpperCase()
                                          : 'K',
                                      style: const TextStyle(
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          review.customerName,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 16,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Row(
                                          children: [
                                            StarRating(
                                              rating: review.rating.toDouble(),
                                              size: 16,
                                            ),
                                            const SizedBox(width: 8),
                                            Text(
                                              _formatDate(review.createdAt),
                                              style: TextStyle(
                                                color: Colors.grey[600],
                                                fontSize: 12,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              if (review.comment != null &&
                                  review.comment!.isNotEmpty) ...[
                                const SizedBox(height: 12),
                                Text(
                                  review.comment!,
                                  style: const TextStyle(
                                    fontSize: 14,
                                    height: 1.4,
                                  ),
                                ),
                              ],
                            ],
                          );
                        },
                      ),
              ),
            ],
          );
        },
      ),
      floatingActionButton: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          if (authProvider.user?['role'] == 'customer') {
            return FloatingActionButton.extended(
              onPressed: () async {
                final result = await Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => ReviewFormScreen(
                      serviceId: widget.serviceId,
                      serviceName: widget.serviceName,
                    ),
                  ),
                );
                if (result == true) {
                  // Refresh reviews if a new review was submitted
                  context.read<ReviewProvider>().loadReviewsForService(
                    widget.serviceId,
                  );
                }
              },
              icon: const Icon(Icons.add),
              label: const Text('Đánh giá'),
              backgroundColor: Colors.blue,
              foregroundColor: Colors.white,
            );
          }
          return const SizedBox.shrink();
        },
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 365) {
      return '${(difference.inDays / 365).floor()} năm trước';
    } else if (difference.inDays > 30) {
      return '${(difference.inDays / 30).floor()} tháng trước';
    } else if (difference.inDays > 0) {
      return '${difference.inDays} ngày trước';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} giờ trước';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} phút trước';
    } else {
      return 'Vừa xong';
    }
  }
}
