import 'package:flutter/foundation.dart';
import 'review_model.dart';
import 'review_repository.dart';

class ReviewProvider with ChangeNotifier {
  final ReviewRepository _repository = ReviewRepository();

  List<Review> _reviews = [];
  bool _isLoading = false;
  String? _error;

  List<Review> get reviews => _reviews;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadReviewsForService(String serviceId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _reviews = await _repository.getReviewsForService(serviceId);
      _error = null;
    } catch (e) {
      _error = e.toString();
      _reviews = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> submitReview(
    String serviceId,
    int rating,
    String? comment,
  ) async {
    try {
      final newReview = await _repository.createReview(
        serviceId,
        rating,
        comment,
      );
      _reviews.insert(0, newReview); // Add new review at the top
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  double get averageRating {
    if (_reviews.isEmpty) return 0.0;
    final total = _reviews.fold<int>(0, (sum, review) => sum + review.rating);
    return total / _reviews.length;
  }
}
