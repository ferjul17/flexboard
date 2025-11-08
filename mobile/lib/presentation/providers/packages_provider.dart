import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/package_model.dart';
import 'providers.dart';

// Packages provider
final packagesProvider = FutureProvider<List<PackageModel>>((ref) async {
  final packageRepo = ref.watch(packageRepositoryProvider);
  return await packageRepo.getPackages();
});

// Single package provider
final packageProvider = FutureProvider.family<PackageModel, String>((ref, id) async {
  final packageRepo = ref.watch(packageRepositoryProvider);
  return await packageRepo.getPackageById(id);
});
