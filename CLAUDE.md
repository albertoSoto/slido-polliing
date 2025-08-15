# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Slido Polling** - a real-time interactive polling system for presentations built with **NestJS and TypeScript**. It enables presenters to create live polls embedded directly in markdown presentations, with audiences voting via mobile devices using QR codes, featuring automatic ngrok tunneling for public access.

### Core Architecture

**NestJS Backend** (`src/`): Modular TypeScript backend with dependency injection
- **Polling Module**: Poll lifecycle management, voting logic, real-time WebSocket updates
- **Presentation Module**: Markdown presentation parsing with YAML frontmatter, slide navigation
- **Common Module**: Shared services (NgrokService) exported across modules
- **App Module**: Main Handlebars template serving (vote, admin, presenter interfaces)

**Presentation System**: YAML frontmatter + Markdown content in `polls/` directory
- Poll slides auto-generate QR codes and start polls when navigated to
- Results slides auto-stop polls and display live charts
- Custom poll IDs supported for cleaner results referencing

**Template System** (`views/`): Handlebars server-side rendering
- `app/`: Full interfaces with Socket.IO integration
- `iframe/`: Embeddable components for external integration
- `layouts/`: Shared template structure

**Electron Integration**: Desktop wrapper (`electron-main.js`) spawning NestJS server

### Key Technologies
- **NestJS** - TypeScript framework with decorators and dependency injection
- **Socket.IO Gateway** - Real-time WebSocket communication for live updates
- **Handlebars** - Server-side templating with data injection
- **QR Code + ngrok** - Mobile access with automatic public tunneling
- **YAML parsing** - Frontmatter-driven presentation configuration
- **Chart.js** - Real-time results visualization

## Development Commands

**This project uses pnpm as the package manager.**

```bash
# Package management
pnpm install            # Install dependencies
pnpm add <package>      # Add dependency
pnpm add -D <package>   # Add dev dependency

# Development server with auto-reload (NestJS watch mode)
pnpm dev

# Production server
pnpm start

# Build NestJS application
pnpm build

# Debug with breakpoints
pnpm debug

# Generate Marp slides with live reload (serves on port 3001)
pnpm slides

# Electron desktop app
pnpm electron:dev       # Development with hot reload
pnpm electron          # Production desktop app
pnpm electron:build    # Build installer (current platform)
pnpm electron:build-all # Build installers (all platforms)
pnpm electron:pack     # Package without installer

# Docker development
docker-compose up
```

## Architecture Deep Dive

### NestJS Module Structure
- **PollingService**: In-memory poll storage with custom ID support, vote counting, poll lifecycle management
- **PollingGateway**: WebSocket events (`poll-started`, `vote-update`, `poll-stopped`, `slide-changed`)
- **PresentationService**: Markdown parsing with YAML frontmatter, slide navigation, QR placeholder replacement
- **NgrokService**: Lifecycle-managed tunnel creation with proper cleanup and environment variable injection
- **AppController**: Main template routes + QR code generation endpoint

### Presentation System with Auto-Activation
Markdown files in `polls/` directory with YAML frontmatter support custom poll IDs:
```yaml
---
title: "Poll Question 1"
type: "poll"
poll:
  id: "programming-languages"  # Custom ID (optional)
  question: "What's your favorite programming language?"
  options:
    - "JavaScript"
    - "Python"
---

---
title: "Poll Results 1"
type: "results"
resultsFor: "programming-languages"  # References poll ID
---
```

**Key behaviors:**
- Poll slides auto-generate content with `{{AUTO_POLL_QR}}` placeholder replacement
- Results slides auto-stop active polls and show vote counts
- Navigation triggers poll lifecycle events automatically

### WebSocket Communication
Real-time events handled by `PollingGateway`:
- `poll-started`: New poll begins, sent to all connected clients
- `vote-update`: Real-time vote counting updates 
- `poll-stopped`: Poll ends when navigating to results slides
- `slide-changed`: Presenter navigation triggers poll activation

### API Endpoints
Core REST endpoints:
- `GET /api/qr/:pollId`: Generate QR code PNG with ngrok URL
- `GET /api/presentation/load/:filename`: Load presentation from polls/
- `POST /api/presentation/navigate/:direction`: Navigate slides and auto-start/stop polls
- `POST /api/poll`: Create manual poll
- `POST /api/vote/:pollId/:optionId`: Submit vote

### Template System
Handlebars templates with data injection:
- `/`: Vote interface (`views/app/vote.hbs`)
- `/admin`: Poll administration (`views/app/admin.hbs`) 
- `/presenter`: Presenter controls with presentation dropdown (`views/app/presenter.hbs`)
- Templates use CDN resources (Socket.IO, Chart.js) for reliability

### Environment Configuration
Critical environment variables (see `.env.example`):
- `NGROK_AUTHTOKEN`: **Required** for public access tunneling (sign up at ngrok.com)
- `PORT`: Server port (default 3000)
- `NODE_ENV`: Environment mode (development/production)
- `ELECTRON_APP`: Set by Electron wrapper

## Development Notes

### Poll System Architecture
**Custom Poll IDs**: Use meaningful IDs instead of numeric indices
```yaml
poll:
  id: "user-satisfaction"  # Custom string/number ID
  question: "How satisfied are you?"
  options: ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied"]
```
Then reference in results slides: `resultsFor: "user-satisfaction"`

**Auto-Generated Content**: Poll slides with empty content auto-generate:
- Poll question and options display
- QR code with ngrok URL via `{{AUTO_POLL_QR}}` placeholder replacement
- Vote counting and real-time updates

### Key Service Interactions
- **PresentationService** parses YAML + markdown, handles `{{AUTO_POLL_QR}}` replacement
- **PollingService** creates polls with custom IDs, manages in-memory storage
- **NgrokService** sets `process.env.NGROK_URL` for QR code generation
- **PollingGateway** broadcasts real-time events to all connected clients

### Adding New Slide Types
1. Extend `PresentationSlide` interface in `src/common/interfaces/poll.interface.ts`
2. Update `parsePresentationFile()` in `PresentationService`
3. Add navigation logic in `PresentationController.navigate()`
4. Update frontend template rendering in `views/app/presenter.hbs`

### Testing Workflow
- **Development**: `pnpm dev` (NestJS watch mode with auto-reload)
- **Presenter Interface**: `localhost:3000/presenter` (load presentations from dropdown)
- **Mobile Testing**: Use ngrok URL or `localhost:3000` for voting
- **Admin Panel**: `localhost:3000/admin` for manual poll management
- **Template changes**: Auto-reload in development mode

### Module Dependencies
- **CommonModule** exports NgrokService to PresentationModule
- **PollingModule** provides PollingService and PollingGateway
- **PresentationModule** depends on CommonModule for ngrok URL access
- All modules imported in AppModule for proper dependency injection