import 'package:flutter/material.dart';
import 'constants.dart';

/// App Theme Constants - Synchronized with Web CSS Variables
class AppTheme {
  // Color Constants (matching web CSS variables)
  static const Color primaryLight = Color(
    0xFF0EA5E9,
  ); // --primary: #0ea5e9 (sky-500)
  static const Color primary600Light = Color(
    0xFF0284C7,
  ); // --primary-600: #0284c7
  static const Color primaryDark = Color(
    0xFF38BDF8,
  ); // --primary: #38bdf8 (lighter blue for dark theme)
  static const Color primary600Dark = Color(
    0xFF0EA5E9,
  ); // --primary-600: #0ea5e9 (for dark theme)

  // Text Colors
  static const Color textLight = Color(
    0xFF0F172A,
  ); // --text: #0f172a (slate-900)
  static const Color textDark = Color(0xFFF1F5F9); // --text: #f1f5f9
  static const Color mutedLight = Color(
    0xFF64748B,
  ); // --muted: #64748b (slate-500)
  static const Color mutedDark = Color(0xFF94A3B8); // --muted: #94a3b8

  // Background Colors
  static const Color bgLight = Color(0xFFF5F7FB); // --bg: #f5f7fb
  static const Color bgDark = Color(0xFF0F172A); // --bg: #0f172a
  static const Color cardBgLight = Color(0xFFFFFFFF); // --card-bg: #ffffff
  static const Color cardBgDark = Color(0xFF1E293B); // --card-bg: #1e293b

  // Border Colors
  static const Color borderLight = Color(0xFFE5E7EB); // --border: #e5e7eb
  static const Color borderDark = Color(0xFF334155); // --border: #334155

  // Status Colors (matching web status badges)
  static const Color statusPending = Color(0xFFFBBF24); // Yellow
  static const Color statusConfirmed = Color(0xFF3B82F6); // Blue
  static const Color statusDone = Color(0xFF10B981); // Green
  static const Color statusCancelled = Color(0xFFEF4444); // Red

  // Radius
  static const double radius = 12.0; // --radius: 12px

  /// Light Theme
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryLight,
        brightness: Brightness.light,
        primary: primaryLight,
        onPrimary: Colors.white,
        secondary: primary600Light,
        surface: cardBgLight,
        background: bgLight,
        onBackground: textLight,
        onSurface: textLight,
      ),

      // App Bar Theme
      appBarTheme: AppBarTheme(
        elevation: 2,
        centerTitle: false,
        backgroundColor: cardBgLight,
        foregroundColor: textLight,
        surfaceTintColor: Colors.transparent,
        shadowColor: Colors.black26,
      ),

      // Card Theme
      cardTheme: CardThemeData(
        elevation: 2,
        color: cardBgLight,
        surfaceTintColor: Colors.transparent,
        shadowColor: Colors.black12,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius),
        ),
      ),

      // Input Decoration Theme
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: cardBgLight,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: BorderSide(color: borderLight),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: BorderSide(color: borderLight),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: BorderSide(color: primaryLight, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 12,
        ),
      ),

      // Button Themes
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 2,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          backgroundColor: primaryLight,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radius),
          ),
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          side: BorderSide(color: primaryLight, width: 2),
          foregroundColor: primaryLight,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radius),
          ),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          foregroundColor: primaryLight,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radius),
          ),
        ),
      ),

      // List Tile Theme
      listTileTheme: ListTileThemeData(
        tileColor: cardBgLight,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),

      // Divider Theme
      dividerTheme: DividerThemeData(color: borderLight, thickness: 1),
    );
  }

  /// Dark Theme
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryDark,
        brightness: Brightness.dark,
        primary: primaryDark,
        onPrimary: Colors.black,
        secondary: primary600Dark,
        surface: cardBgDark,
        background: bgDark,
        onBackground: textDark,
        onSurface: textDark,
      ),

      // App Bar Theme
      appBarTheme: AppBarTheme(
        elevation: 2,
        centerTitle: false,
        backgroundColor: cardBgDark,
        foregroundColor: textDark,
        surfaceTintColor: Colors.transparent,
        shadowColor: Colors.black54,
      ),

      // Card Theme
      cardTheme: CardThemeData(
        elevation: 4,
        color: cardBgDark,
        surfaceTintColor: Colors.transparent,
        shadowColor: Colors.black54,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius),
        ),
      ),

      // Input Decoration Theme
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: cardBgDark,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: BorderSide(color: borderDark),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: BorderSide(color: borderDark),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: BorderSide(color: primaryDark, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 12,
        ),
      ),

      // Button Themes
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 4,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          backgroundColor: primaryDark,
          foregroundColor: Colors.black,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radius),
          ),
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          side: BorderSide(color: primaryDark, width: 2),
          foregroundColor: primaryDark,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radius),
          ),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          foregroundColor: primaryDark,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radius),
          ),
        ),
      ),

      // List Tile Theme
      listTileTheme: ListTileThemeData(
        tileColor: cardBgDark,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),

      // Divider Theme
      dividerTheme: DividerThemeData(color: borderDark, thickness: 1),
    );
  }

  /// Status Color Helper
  static Color getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return statusPending;
      case 'confirmed':
        return statusConfirmed;
      case 'done':
        return statusDone;
      case 'cancelled':
        return statusCancelled;
      default:
        return mutedLight;
    }
  }

  /// Status Text Helper (Vietnamese)
  static String getStatusText(String status) {
    return AppConstants.statusLabels[status.toLowerCase()] ?? status;
  }
}
