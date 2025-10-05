import 'local_overrides.dart';

// Web-specific environment configuration
class WebEnv {
  static const String apiBase = 'http://localhost:5000';
  static const String socketBase = 'http://localhost:5000';
}

// Check if running on web
bool get isWeb => identical(0, 0.0);

class PlatformEnv {
  static String get apiBase {
    if (isWeb) return WebEnv.apiBase;
    return kLanApiBase ??
        'http://10.0.2.2:5000'; // Android emulator or LAN override
  }

  static String get socketBase {
    if (isWeb) return WebEnv.socketBase;
    return kLanApiBase ?? 'http://10.0.2.2:5000';
  }
}
