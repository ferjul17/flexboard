import 'package:flutter/material.dart';

void main() {
  runApp(const FlexboardApp());
}

class FlexboardApp extends StatelessWidget {
  const FlexboardApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flexboard',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: const Text('Flexboard'),
      ),
      body: const Center(
        child: Text('Welcome to Flexboard'),
      ),
    );
  }
}
