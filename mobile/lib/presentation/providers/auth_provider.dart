import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/user_model.dart';
import 'providers.dart';

// Auth state
class AuthState {
  final UserModel? user;
  final bool isAuthenticated;
  final bool isLoading;
  final String? error;

  const AuthState({
    this.user,
    this.isAuthenticated = false,
    this.isLoading = false,
    this.error,
  });

  AuthState copyWith({
    UserModel? user,
    bool? isAuthenticated,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      user: user ?? this.user,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

// Auth notifier
class AuthNotifier extends StateNotifier<AuthState> {
  final Ref ref;

  AuthNotifier(this.ref) : super(const AuthState()) {
    _checkAuthStatus();
  }

  Future<void> _checkAuthStatus() async {
    final authRepo = ref.read(authRepositoryProvider);
    final isAuth = await authRepo.isAuthenticated();

    if (isAuth) {
      try {
        final userRepo = ref.read(userRepositoryProvider);
        final user = await userRepo.getProfile();
        state = state.copyWith(
          user: user,
          isAuthenticated: true,
        );
      } catch (e) {
        state = state.copyWith(isAuthenticated: false);
      }
    }
  }

  Future<void> register({
    required String email,
    required String username,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final authRepo = ref.read(authRepositoryProvider);
      final response = await authRepo.register(
        email: email,
        username: username,
        password: password,
      );
      state = state.copyWith(
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      rethrow;
    }
  }

  Future<void> login({
    required String email,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final authRepo = ref.read(authRepositoryProvider);
      final response = await authRepo.login(
        email: email,
        password: password,
      );
      state = state.copyWith(
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      rethrow;
    }
  }

  Future<void> logout() async {
    try {
      final authRepo = ref.read(authRepositoryProvider);
      await authRepo.logout();
    } finally {
      state = const AuthState();
    }
  }

  Future<void> refreshProfile() async {
    if (!state.isAuthenticated) return;

    try {
      final userRepo = ref.read(userRepositoryProvider);
      final user = await userRepo.getProfile();
      state = state.copyWith(user: user);
    } catch (e) {
      // Handle error silently
    }
  }
}

// Provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref);
});
