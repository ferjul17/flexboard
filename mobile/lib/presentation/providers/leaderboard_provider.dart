import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/leaderboard_model.dart';
import 'providers.dart';

enum LeaderboardType { global, monthly, weekly, regional }

// Leaderboard state
class LeaderboardState {
  final List<LeaderboardEntryModel> entries;
  final PaginationModel? pagination;
  final bool isLoading;
  final String? error;

  const LeaderboardState({
    this.entries = const [],
    this.pagination,
    this.isLoading = false,
    this.error,
  });

  LeaderboardState copyWith({
    List<LeaderboardEntryModel>? entries,
    PaginationModel? pagination,
    bool? isLoading,
    String? error,
  }) {
    return LeaderboardState(
      entries: entries ?? this.entries,
      pagination: pagination ?? this.pagination,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

// Leaderboard notifier
class LeaderboardNotifier extends StateNotifier<LeaderboardState> {
  final Ref ref;
  final LeaderboardType type;
  final String? region;

  LeaderboardNotifier(this.ref, this.type, {this.region})
      : super(const LeaderboardState()) {
    loadLeaderboard();
  }

  Future<void> loadLeaderboard({int page = 1, int pageSize = 50}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final leaderboardRepo = ref.read(leaderboardRepositoryProvider);
      LeaderboardResponseModel response;

      switch (type) {
        case LeaderboardType.global:
          response = await leaderboardRepo.getGlobalLeaderboard(
            page: page,
            pageSize: pageSize,
          );
          break;
        case LeaderboardType.monthly:
          response = await leaderboardRepo.getMonthlyLeaderboard(
            page: page,
            pageSize: pageSize,
          );
          break;
        case LeaderboardType.weekly:
          response = await leaderboardRepo.getWeeklyLeaderboard(
            page: page,
            pageSize: pageSize,
          );
          break;
        case LeaderboardType.regional:
          if (region == null) {
            throw Exception('Region is required for regional leaderboard');
          }
          response = await leaderboardRepo.getRegionalLeaderboard(
            region: region!,
            page: page,
            pageSize: pageSize,
          );
          break;
      }

      state = state.copyWith(
        entries: page == 1 ? response.data : [...state.entries, ...response.data],
        pagination: response.pagination,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> refresh() async {
    await loadLeaderboard(page: 1);
  }

  Future<void> loadMore() async {
    if (state.pagination != null &&
        state.pagination!.page < state.pagination!.totalPages) {
      await loadLeaderboard(page: state.pagination!.page + 1);
    }
  }
}

// Provider factory
final leaderboardProvider = StateNotifierProvider.family<
    LeaderboardNotifier,
    LeaderboardState,
    Map<String, dynamic>>((ref, params) {
  final type = params['type'] as LeaderboardType;
  final region = params['region'] as String?;
  return LeaderboardNotifier(ref, type, region: region);
});

// Convenient providers for each leaderboard type
final globalLeaderboardProvider =
    StateNotifierProvider<LeaderboardNotifier, LeaderboardState>((ref) {
  return LeaderboardNotifier(ref, LeaderboardType.global);
});

final monthlyLeaderboardProvider =
    StateNotifierProvider<LeaderboardNotifier, LeaderboardState>((ref) {
  return LeaderboardNotifier(ref, LeaderboardType.monthly);
});

final weeklyLeaderboardProvider =
    StateNotifierProvider<LeaderboardNotifier, LeaderboardState>((ref) {
  return LeaderboardNotifier(ref, LeaderboardType.weekly);
});
