import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:flexboard/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const FlexboardApp());

    expect(find.text('Flexboard'), findsWidgets);
    expect(find.text('Welcome to Flexboard'), findsOneWidget);
  });
}
