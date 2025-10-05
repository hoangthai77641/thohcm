import 'package:flutter/foundation.dart';
import 'auth_repository.dart';
import '../../core/services/socket_service.dart';
import '../notifications/notifications_provider.dart';

class AuthProvider with ChangeNotifier {
  final _repo = AuthRepository();

  Map<String, dynamic>? user;
  String? error;
  String? errorCode;
  Map<String, dynamic>? errorDetails;
  bool loading = false;
  NotificationsProvider? _notificationsProvider;

  void setNotificationsProvider(NotificationsProvider provider) {
    _notificationsProvider = provider;
    SocketService().setNotificationsProvider(provider);
  }

  Future<bool> tryRestoreSession() async {
    user = await _repo.getMe();
    if (user != null) {
      // Connect to socket for real-time notifications
      await SocketService().connect(userId: user!['_id'] ?? user!['id']);
    }
    notifyListeners();
    return user != null;
  }

  Future<bool> login(String phone, String password) async {
    loading = true;
    error = null;
    errorCode = null;
    errorDetails = null;
    notifyListeners();
    try {
      final data = await _repo.login(phone: phone, password: password);
      user = data['user'];

      // Connect to socket for real-time notifications
      if (user != null) {
        await SocketService().connect(userId: user!['_id'] ?? user!['id']);
      }

      loading = false;
      notifyListeners();
      return true;
    } catch (e) {
      if (e is AuthException) {
        error = e.message;
        errorCode = e.code;
        errorDetails = e.details;
      } else {
        error = e.toString();
        errorCode = null;
        errorDetails = null;
      }
      loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    // Disconnect socket
    SocketService().disconnect();

    await _repo.logout();
    user = null;
    notifyListeners();
  }

  Future<bool> updateProfile(Map<String, dynamic> payload) async {
    loading = true;
    error = null;
    errorCode = null;
    errorDetails = null;
    notifyListeners();
    try {
      final updated = await _repo.updateMe(payload);
      user = updated;
      loading = false;
      notifyListeners();
      return true;
    } catch (e) {
      error = e.toString();
      loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> registerWorker({
    required String name,
    required String phone,
    required String password,
    String? address,
  }) async {
    loading = true;
    error = null;
    errorCode = null;
    errorDetails = null;
    notifyListeners();
    try {
      await _repo.registerWorker(
        name: name,
        phone: phone,
        password: password,
        address: address,
      );
      loading = false;
      notifyListeners();
      return true;
    } catch (e) {
      error = e.toString();
      loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> uploadAvatar(dynamic imageFile) async {
    loading = true;
    error = null;
    errorCode = null;
    errorDetails = null;
    notifyListeners();
    try {
      final updated = await _repo.uploadAvatar(imageFile);
      user = updated;
      loading = false;
      notifyListeners();
      return true;
    } catch (e) {
      error = e.toString();
      loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteAvatar() async {
    loading = true;
    error = null;
    errorCode = null;
    errorDetails = null;
    notifyListeners();
    try {
      final updated = await _repo.deleteAvatar();
      user = updated;
      loading = false;
      notifyListeners();
      return true;
    } catch (e) {
      error = e.toString();
      loading = false;
      notifyListeners();
      return false;
    }
  }
}
