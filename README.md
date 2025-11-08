# Flexboard

Flexboard is a mobile application with a backend API, organized as a monorepo.

## Repository Structure

This monorepo contains two main projects:

```
flexboard/
├── backend/          # Bun backend service
├── mobile/           # Flutter mobile application
└── README.md         # This file
```

## Projects

### Backend

The backend is built with [Bun](https://bun.sh/), a fast JavaScript runtime.

- **Location**: `backend/`
- **Language**: TypeScript
- **Runtime**: Bun

See [backend/README.md](backend/README.md) for more details.

### Mobile

The mobile application is built with [Flutter](https://flutter.dev/), supporting both iOS and Android.

- **Location**: `mobile/`
- **Language**: Dart
- **Framework**: Flutter

See [mobile/README.md](mobile/README.md) for more details.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0 (for backend)
- [Flutter](https://flutter.dev/) >= 3.0.0 (for mobile)
- [Dart](https://dart.dev/) >= 3.0.0 (for mobile)

### Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd flexboard
```

2. Set up the backend:

```bash
cd backend
bun install
bun run dev
```

3. Set up the mobile app:

```bash
cd mobile
flutter pub get
flutter run
```

## Development

Each project can be developed independently. Refer to the README files in each directory for specific development instructions.

## License

[Add your license here]
