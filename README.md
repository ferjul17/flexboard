# Flexboard

A wealth display platform designed as a mobile application where financial capability becomes the primary metric of engagement.

## Project Structure

This is a monorepo containing:

- **mobile/** - Flutter mobile application (iOS & Android)
- **backend/** - Bun runtime API server
- **docker-compose.yml** - Local development environment setup

## Tech Stack

### Frontend (Mobile)
- Flutter (iOS & Android)
- Riverpod (State Management)
- Go Router (Navigation)
- Dio (HTTP Client)
- WebSocket (Real-time Updates)

### Backend
- Bun runtime
- Hono (Web Framework)
- PostgreSQL (Database)
- JWT Authentication
- Zod (Validation)
- WebSocket (Real-time Communication)
- Scheduled Jobs (Leaderboard Auto-reset)

### Infrastructure
- Docker & Docker Compose
- PostgreSQL 16

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- [Flutter](https://flutter.dev/) SDK installed
- [Docker](https://www.docker.com/) and Docker Compose installed

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
bun install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Start the development environment with Docker Compose:
```bash
cd ..
docker-compose up -d
```

5. Run database migrations:
```bash
cd backend
bun run db:migrate
```

6. (Optional) Seed the database with demo data:
```bash
bun run db:seed
```

The backend API will be available at `http://localhost:3000`

### Mobile Setup

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
flutter pub get
```

3. Run the app:
```bash
# For iOS
flutter run

# For Android
flutter run
```

## Development

### Backend Development

Start the backend in development mode (with hot reload):
```bash
cd backend
bun run dev
```

### Database Management

- **pgAdmin** is available at `http://localhost:5050`
  - Email: `admin@flexboard.com`
  - Password: `admin`

- **Run migrations:**
```bash
cd backend
bun run db:migrate
```

- **Seed database:**
```bash
cd backend
bun run db:seed
```

### API Documentation

#### Authentication Endpoints
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user

#### User Endpoints
- `GET /api/v1/user/profile` - Get user profile
- `PUT /api/v1/user/profile` - Update user profile

#### Leaderboard Endpoints
- `GET /api/v1/leaderboard/global` - Get global leaderboard
- `GET /api/v1/leaderboard/monthly` - Get monthly leaderboard
- `GET /api/v1/leaderboard/weekly` - Get weekly leaderboard
- `GET /api/v1/leaderboard/regional?region=US` - Get regional leaderboard
- `GET /api/v1/leaderboard/history?type=global` - Get user's rank history
- `GET /api/v1/leaderboard/me` - Get current user's rank in all leaderboards

#### WebSocket Endpoint
- `WS /ws/leaderboard` - Real-time leaderboard updates and rank change notifications

## Stage 1: Foundation & Infrastructure ✅

- [x] Initialize Flutter project with proper folder structure
- [x] Set up backend API infrastructure with Bun runtime
- [x] Create Dockerfile for backend API
- [x] Create docker-compose.yml for local development
- [x] Design and implement PostgreSQL database schema
- [x] Implement basic authentication system (JWT tokens)
- [x] Set up environment configuration (dev, staging, production)

## Stage 2: Core Leaderboard & Purchase System ✅

- [x] Create user registration and onboarding flow
- [x] Implement global leaderboard display
- [x] Build Flex Points system
- [x] Integrate Stripe payment processing
- [x] Create purchase packages UI
- [x] Implement transaction recording and validation
- [x] Build user profile page

## Stage 3: Advanced Leaderboards & Real-time Updates ✅

- [x] Implement monthly leaderboard with auto-reset functionality
- [x] Implement weekly leaderboard with auto-reset functionality
- [x] Create regional leaderboards with geographic filtering
- [x] Set up WebSocket infrastructure for real-time updates
- [x] Implement real-time rank change notifications
- [x] Create leaderboard position history tracking
- [x] Add scheduled job system for automatic leaderboard resets
- [x] Build mobile WebSocket client with reconnection logic
- [x] Implement animated rank change notifications in mobile app
- [x] Create rank history visualization charts

## Next Steps (Stage 4)

- [ ] Design and implement achievement system database schema
- [ ] Create achievement badges
- [ ] Implement achievement unlock logic and notifications
- [ ] Build exclusive titles system based on spending tiers
- [ ] Create profile customization features

## Documentation

- [Product Specification](./PRODUCT_SPEC.md)
- [Development Roadmap](./ROADMAP.md)

## License

Proprietary - All rights reserved
