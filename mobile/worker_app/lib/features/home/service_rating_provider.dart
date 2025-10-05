import 'package:flutter/foundation.dart';
import '../services/services_repository.dart';

class ServiceRatingProvider with ChangeNotifier {
  final _repo = ServicesRepository();

  List<Map<String, dynamic>> _services = [];
  bool _loading = false;
  String? _error;

  List<Map<String, dynamic>> get services => _services;
  bool get loading => _loading;
  String? get error => _error;

  Future<void> loadServices() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      _services = await _repo.list();
      // Sort by rating descending
      _services.sort((a, b) {
        final ratingA =
            double.tryParse(a['averageRating']?.toString() ?? '0') ?? 0;
        final ratingB =
            double.tryParse(b['averageRating']?.toString() ?? '0') ?? 0;
        return ratingB.compareTo(ratingA);
      });
      _loading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _loading = false;
      notifyListeners();
    }
  }
}
