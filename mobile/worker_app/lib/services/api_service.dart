import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/env.dart';

class ApiService {
  static String get baseUrl => Env.apiBase;

  static final Dio _dio = Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ),
  );

  static Future<Map<String, dynamic>> get(String endpoint) async {
    try {
      final token = await _getToken();
      if (token != null) {
        _dio.options.headers['Authorization'] = 'Bearer $token';
      }

      final response = await _dio.get(endpoint);
      return {'success': true, 'data': response.data};
    } on DioException catch (e) {
      return {
        'success': false,
        'error': e.response?.data?['message'] ?? e.message,
      };
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  static Future<Map<String, dynamic>> post(
    String endpoint,
    Map<String, dynamic> data,
  ) async {
    try {
      final token = await _getToken();
      if (token != null) {
        _dio.options.headers['Authorization'] = 'Bearer $token';
      }

      final response = await _dio.post(endpoint, data: data);
      return {'success': true, 'data': response.data};
    } on DioException catch (e) {
      return {
        'success': false,
        'error': e.response?.data?['message'] ?? e.message,
      };
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  static Future<Map<String, dynamic>> put(
    String endpoint,
    Map<String, dynamic> data,
  ) async {
    try {
      final token = await _getToken();
      if (token != null) {
        _dio.options.headers['Authorization'] = 'Bearer $token';
      }

      final response = await _dio.put(endpoint, data: data);
      return {'success': true, 'data': response.data};
    } on DioException catch (e) {
      return {
        'success': false,
        'error': e.response?.data?['message'] ?? e.message,
      };
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  static Future<Map<String, dynamic>> delete(String endpoint) async {
    try {
      final token = await _getToken();
      if (token != null) {
        _dio.options.headers['Authorization'] = 'Bearer $token';
      }

      final response = await _dio.delete(endpoint);
      return {'success': true, 'data': response.data};
    } on DioException catch (e) {
      return {
        'success': false,
        'error': e.response?.data?['message'] ?? e.message,
      };
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  static Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  // Banner API methods
  static Future<List<Map<String, dynamic>>> getBanners() async {
    try {
      final response = await get('/api/banners/active');
      if (response['success']) {
        final List<dynamic> data = response['data'];
        return data.cast<Map<String, dynamic>>();
      } else {
        throw Exception(response['error']);
      }
    } catch (e) {
      throw Exception('Error fetching banners: $e');
    }
  }

  static Future<void> updateBannerViews(String bannerId) async {
    try {
      await post('/api/banners/$bannerId/view', {});
    } catch (e) {
      // Ignore view tracking errors
      print('Error tracking banner view: $e');
    }
  }

  static Future<void> updateBannerClicks(String bannerId) async {
    try {
      await post('/api/banners/$bannerId/click', {});
    } catch (e) {
      // Ignore click tracking errors
      print('Error tracking banner click: $e');
    }
  }
}
