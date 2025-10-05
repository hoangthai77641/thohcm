import 'package:flutter/foundation.dart'
    show TargetPlatform, defaultTargetPlatform, kIsWeb;

import 'local_overrides.dart';

class Env {
  static final String apiBase = _resolveApiBase();
  static final String socketBase = _resolveSocketBase();

  static String _resolveApiBase() {
    const apiBaseEnv = String.fromEnvironment('API_BASE', defaultValue: '');
    if (apiBaseEnv.isNotEmpty) return apiBaseEnv;

    const apiHostEnv = String.fromEnvironment('API_HOST', defaultValue: '');
    if (apiHostEnv.isNotEmpty) {
      final hasScheme =
          apiHostEnv.startsWith('http://') || apiHostEnv.startsWith('https://');
      return hasScheme ? apiHostEnv : 'http://$apiHostEnv';
    }

    if (kLanApiBase != null && kLanApiBase!.isNotEmpty) {
      return kLanApiBase!;
    }

    if (kIsWeb) return 'http://localhost:5000';

    // Default loopback mapping for emulators/simulators.
    final platform = defaultTargetPlatform;
    if (platform == TargetPlatform.android) return 'http://10.0.2.2:5000';
    if (platform == TargetPlatform.iOS) return 'http://127.0.0.1:5000';

    // Fallback for desktop targets.
    return 'http://localhost:5000';
  }

  static String _resolveSocketBase() {
    const socketBaseEnv = String.fromEnvironment(
      'SOCKET_BASE',
      defaultValue: '',
    );
    if (socketBaseEnv.isNotEmpty) {
      return socketBaseEnv;
    }
    if (kLanApiBase != null && kLanApiBase!.isNotEmpty) {
      return kLanApiBase!;
    }

    return apiBase;
  }
}
