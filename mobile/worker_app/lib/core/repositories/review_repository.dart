import '../models/review.dart';
import '../api_client.dart';

class ReviewRepository {
  final ApiClient _apiClient;

  ReviewRepository(this._apiClient);

  // Get reviews for a specific service
  Future<List<Review>> getServiceReviews(String serviceId) async {
    try {
      final response = await _apiClient.dio.get('/reviews/service/$serviceId');

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => Review.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load service reviews');
      }
    } catch (e) {
      throw Exception('Error getting service reviews: $e');
    }
  }

  // Get reviews for current worker's services
  Future<List<Review>> getMyServiceReviews() async {
    try {
      final response = await _apiClient.dio.get('/reviews/my-services');

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => Review.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load my service reviews');
      }
    } catch (e) {
      throw Exception('Error getting my service reviews: $e');
    }
  }

  // Create a new review
  Future<Review> createReview({
    required String serviceId,
    required int rating,
    required String comment,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        '/reviews',
        data: {'service': serviceId, 'rating': rating, 'comment': comment},
      );

      if (response.statusCode == 201) {
        return Review.fromJson(response.data);
      } else {
        throw Exception('Failed to create review');
      }
    } catch (e) {
      throw Exception('Error creating review: $e');
    }
  }

  // Update a review
  Future<Review> updateReview({
    required String reviewId,
    required int rating,
    required String comment,
  }) async {
    try {
      final response = await _apiClient.dio.put(
        '/reviews/$reviewId',
        data: {'rating': rating, 'comment': comment},
      );

      if (response.statusCode == 200) {
        return Review.fromJson(response.data);
      } else {
        throw Exception('Failed to update review');
      }
    } catch (e) {
      throw Exception('Error updating review: $e');
    }
  }

  // Delete a review
  Future<void> deleteReview(String reviewId) async {
    try {
      final response = await _apiClient.dio.delete('/reviews/$reviewId');

      if (response.statusCode != 200) {
        throw Exception('Failed to delete review');
      }
    } catch (e) {
      throw Exception('Error deleting review: $e');
    }
  }
}
