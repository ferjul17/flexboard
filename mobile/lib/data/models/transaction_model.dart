import 'package:freezed_annotation/freezed_annotation.dart';

part 'transaction_model.freezed.dart';
part 'transaction_model.g.dart';

@freezed
class TransactionModel with _$TransactionModel {
  const factory TransactionModel({
    required String id,
    required String packageId,
    required String packageName,
    required double amount,
    required int flexPoints,
    required int bonusPercentage,
    required String status,
    String? paymentMethod,
    String? paymentId,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _TransactionModel;

  factory TransactionModel.fromJson(Map<String, dynamic> json) =>
      _$TransactionModelFromJson(json);
}

@freezed
class TransactionStatsModel with _$TransactionStatsModel {
  const factory TransactionStatsModel({
    required int totalTransactions,
    required int completedTransactions,
    required int pendingTransactions,
    required int failedTransactions,
    required double totalSpent,
    required int totalFlexPoints,
  }) = _TransactionStatsModel;

  factory TransactionStatsModel.fromJson(Map<String, dynamic> json) =>
      _$TransactionStatsModelFromJson(json);
}
