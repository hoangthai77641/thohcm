import '../../core/api_client.dart';
import 'review_model.dart';

class ReviewRepository {
  final ApiClient _apiClient = ApiClient();

  Future<List<Review>> getReviewsForService(String serviceId) async {
    try {
      final response = await _apiClient.dio.get('/api/reviews/$serviceId');
      final List<dynamic> data = response.data;
      return data.map((json) => Review.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Không thể tải đánh giá: $e');
    }
  }

  Future<Review> createReview(
    String serviceId,
    int rating,
    String? comment,
  ) async {
    try {
      final response = await _apiClient.dio.post(
        '/api/reviews/$serviceId',
        data: {'rating': rating, 'comment': comment},
      );
      return Review.fromJson(response.data);
    } catch (e) {
      throw Exception('Không thể gửi đánh giá: $e');
    }
  }
}
