import 'package:flutter/material.dart';
import '../models/review.dart';
import '../repositories/review_repository.dart';

class ReviewProvider extends ChangeNotifier {
  final ReviewRepository _reviewRepository;

  ReviewProvider(this._reviewRepository);

  List<Review> _allReviews = [];
  List<Review> _myReviews = [];
  bool _isLoading = false;
  String? _error;

  List<Review> get allReviews => _allReviews;
  List<Review> get myReviews => _myReviews;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Get reviews for a specific service
  Future<void> getServiceReviews(String serviceId) async {
    _setLoading(true);
    try {
      _allReviews = await _reviewRepository.getServiceReviews(serviceId);
      _error = null;
    } catch (e) {
      _error = e.toString();
      _allReviews = [];
    } finally {
      _setLoading(false);
    }
  }

  // Get reviews for current worker's services
  Future<void> getMyServiceReviews() async {
    _setLoading(true);
    try {
      _myReviews = await _reviewRepository.getMyServiceReviews();
      _error = null;
    } catch (e) {
      _error = e.toString();
      _myReviews = [];
    } finally {
      _setLoading(false);
    }
  }

  // Create a new review
  Future<bool> createReview({
    required String serviceId,
    required int rating,
    required String comment,
  }) async {
    _setLoading(true);
    try {
      await _reviewRepository.createReview(
        serviceId: serviceId,
        rating: rating,
        comment: comment,
      );
      _error = null;
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
