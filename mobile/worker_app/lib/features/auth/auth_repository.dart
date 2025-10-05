import 'dart:convert';
import 'package:dio/dio.dart' as dio;
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/api_client.dart';
import '../../core/services/token_service.dart';

class AuthException implements Exception {
  final String message;
  final String? code;
  final Map<String, dynamic>? details;

  AuthException({required this.message, this.code, this.details});

  @override
  String toString() => message;
}

class AuthRepository {
  final _client = ApiClient().dio;
  final _tokenService = TokenService();
  String _extractErrorMessage(Object e) {
    if (e is dio.DioException) {
      final data = e.response?.data;
      if (data is Map<String, dynamic>) {
        final msg = data['message'] ?? data['error'];
        if (msg is String && msg.isNotEmpty) return msg;
      }
      if (data is String && data.isNotEmpty) return data;
      return e.message ?? e.toString();
    }
    return e.toString();
  }

  Future<Map<String, dynamic>> login({
    required String phone,
    required String password,
  }) async {
    try {
      final res = await _client.post(
        '/api/users/login',
        data: {'phone': phone, 'password': password},
      );
      final data = Map<String, dynamic>.from(res.data);
      final token = data['token'] as String?;
      final user = data['user'] as Map<String, dynamic>?;

      if (token != null && user != null) {
        // Sử dụng TokenService để lưu token và thông tin user
        await _tokenService.saveAuthData(
          token: token,
          userId: user['_id'] ?? user['id'] ?? '',
          role: user['role'] ?? 'worker',
          name: user['name'] ?? '',
        );

        // Vẫn lưu trong SharedPreferences cho compatibility
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', token);
        await prefs.setString('me', jsonEncode(user));
      }
      return data;
    } on dio.DioException catch (e) {
      final data = e.response?.data;
      if (data is Map<String, dynamic>) {
        final message =
            (data['message'] ??
                    data['error'] ??
                    e.message ??
                    'Đăng nhập thất bại')
                .toString();
        throw AuthException(
          message: message,
          code: data['code'] as String?,
          details: Map<String, dynamic>.from(data),
        );
      }
      throw AuthException(message: _extractErrorMessage(e));
    } catch (e) {
      throw AuthException(message: _extractErrorMessage(e));
    }
  }

  Future<void> logout() async {
    // Xóa token từ TokenService
    await _tokenService.clearAuthData();

    // Vẫn xóa từ SharedPreferences cho compatibility
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('me');
  }

  Future<Map<String, dynamic>?> getMe() async {
    try {
      final remote = await getMeRemote();
      return remote;
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      final meStr = prefs.getString('me');
      if (meStr == null) return null;
      return Map<String, dynamic>.from(jsonDecode(meStr));
    }
  }

  Future<Map<String, dynamic>> getMeRemote() async {
    try {
      final res = await _client.get('/api/users/me');
      final data = Map<String, dynamic>.from(res.data);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('me', jsonEncode(data));
      return data;
    } catch (e) {
      throw Exception(_extractErrorMessage(e));
    }
  }

  Future<Map<String, dynamic>> updateMe(Map<String, dynamic> payload) async {
    try {
      final res = await _client.put('/api/users/me', data: payload);
      final data = Map<String, dynamic>.from(res.data);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('me', jsonEncode(data));
      return data;
    } catch (e) {
      throw Exception(_extractErrorMessage(e));
    }
  }

  Future<void> registerWorker({
    required String name,
    required String phone,
    required String password,
    String? address,
  }) async {
    try {
      await _client.post(
        '/api/users/register',
        data: {
          'name': name,
          'phone': phone,
          'password': password,
          'address': address,
          'role': 'worker',
        },
      );
    } catch (e) {
      throw Exception(_extractErrorMessage(e));
    }
  }

  Future<Map<String, dynamic>> uploadAvatar(dynamic imageFile) async {
    try {
      final formData = dio.FormData.fromMap({
        'avatar': await dio.MultipartFile.fromFile(
          imageFile.path,
          filename: 'avatar.jpg',
        ),
      });

      final res = await _client.post(
        '/api/users/avatar',
        data: formData,
        options: dio.Options(headers: {'Content-Type': 'multipart/form-data'}),
      );

      final data = Map<String, dynamic>.from(res.data);
      final user = data['user'] as Map<String, dynamic>?;

      if (user != null) {
        // Update stored user data
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('me', jsonEncode(user));
      }

      return user ?? {};
    } catch (e) {
      throw Exception(_extractErrorMessage(e));
    }
  }

  Future<Map<String, dynamic>> deleteAvatar() async {
    try {
      final res = await _client.delete('/api/users/avatar');

      final data = Map<String, dynamic>.from(res.data);
      final user = data['user'] as Map<String, dynamic>?;

      if (user != null) {
        // Update stored user data
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('me', jsonEncode(user));
      }

      return user ?? {};
    } catch (e) {
      throw Exception(_extractErrorMessage(e));
    }
  }
}
