import '../../core/api_client.dart';
import 'booking_model.dart';

class BookingsRepository {
  final _client = ApiClient().dio;

  Future<List<Booking>> listMine({String? status}) async {
    final res = await _client.get(
      '/api/bookings',
      queryParameters: {if (status != null) 'status': status},
    );
    final list = (res.data as List).cast<Map<String, dynamic>>();
    return list.map((e) => Booking.fromJson(e)).toList();
  }

  Future<Booking> updateStatus(String id, String status) async {
    final res = await _client.patch(
      '/api/bookings/$id/status',
      data: {'status': status},
    );
    return Booking.fromJson(Map<String, dynamic>.from(res.data));
  }
}
