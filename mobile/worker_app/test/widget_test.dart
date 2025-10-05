import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:workerapp/main.dart';

void main() {
  testWidgets('App loads', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
