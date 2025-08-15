# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Slido Polling** - a real-time interactive polling system for Marp presentations built with **NestJS and TypeScript**. It allows presenters to create live polls that audiences can participate in via mobile devices using QR codes, with automatic ngrok tunneling for public access.

### Architecture

- **NestJS Backend** (`src/`): Modern TypeScript backend with modular architecture
  - **Polling Module**: Handles poll creation, voting, and real-time updates via WebSocket Gateway
  - **Presentation Module**: Manages presentation loading and navigation from Markdown files
  - **Iframe Module**: Serves templated views for Marp integration (QR codes, questions, results)
  - **App Module**: Main application routes serving Handlebars templates
- **Handlebars Templates** (`views/`): Server-side rendered interfaces
  - `app/`: Main application interfaces (vote, admin, presenter)
  - `iframe/`: Embeddable components for Marp slides
- **Marp Integration** (`slides/`): Clean iframe-based presentations without embedded JavaScript
- **Electron App** (`electron-main.js`): Desktop wrapper that spawns the NestJS server

### Key Technologies
- **NestJS** - Modern Node.js framework with TypeScript and dependency injection
- **TypeScript** - Type safety throughout the application
- **Handlebars** - Logic-less templating engine for server-side rendering
- **Socket.IO** - Real-time WebSocket communication via NestJS Gateway
- **QR Code Generation** - For mobile voting access
- **ngrok Integration** - Automatic public access tunneling
- **Chart.js** - Results visualization in iframe templates
- **Electron** - Cross-platform desktop application wrapper

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
- **PollingService**: In-memory poll storage, vote counting, poll lifecycle management
- **PollingGateway**: WebSocket events (`poll-started`, `vote-update`, `poll-stopped`, `slide-changed`)
- **PresentationService**: Markdown parsing with YAML frontmatter, slide navigation
- **IframeController**: Renders Handlebars templates for Marp embedding
- **NgrokService**: Lifecycle-managed tunnel creation with proper cleanup

### WebSocket Communication
Real-time events handled by `PollingGateway`:
- `poll-started`: New poll begins, sent to all connected clients
- `vote-update`: Real-time vote counting updates
- `poll-stopped`: Poll ends
- `slide-changed`: Presenter navigation triggers poll activation

### API Endpoints
Core REST endpoints:
- `POST /api/poll`: Create manual poll
- `GET /api/poll/:id`: Get poll data  
- `POST /api/vote/:pollId/:optionId`: Submit vote
- `GET /api/qr/:pollId`: Generate QR code
- `GET /api/presentation/load/:filename`: Load presentation from polls/
- `POST /api/presentation/navigate/:direction`: Navigate slides and auto-start polls

### Template System
Handlebars templates with data injection:
- `/`: Vote interface (`views/app/vote.hbs`)
- `/admin`: Poll administration (`views/app/admin.hbs`)
- `/presenter`: Presenter controls (`views/app/presenter.hbs`)
- `/iframe/qr/:pollId?`: QR code display for Marp
- `/iframe/question`: Parameterized question display (`?q=...&options=...`)
- `/iframe/results/:pollId?`: Auto-refreshing results charts

### Presentation System
Markdown files in `polls/` directory with YAML frontmatter:
```yaml
---
title: "Poll Question"
type: "poll"
poll:
  question: "Your question here?"
  options:
    - "Option 1"
    - "Option 2"
---
```

Marp slides use clean iframe embedding:
```html
<iframe src="http://localhost:3000/iframe/qr" width="100%" height="500"></iframe>
<iframe src="http://localhost:3000/iframe/question?q=Question&options=A,B,C" width="100%" height="500"></iframe>
<iframe src="http://localhost:3000/iframe/results" width="100%" height="600"></iframe>
```

### Environment Configuration
Uses `.env` file (see `.env.example`):
- `PORT`: Server port (default 3000)
- `NGROK_AUTHTOKEN`: Required for public access tunneling
- `NODE_ENV`: Environment mode (development/production)
- `ELECTRON_APP`: Set by Electron wrapper

## Development Notes

### Adding New Poll Types
- Poll configuration defined in YAML frontmatter of Markdown slides
- Extend `PresentationSlide` interface in `src/common/interfaces/poll.interface.ts`
- Update `parsePresentationFile()` in `PresentationService`
- Add corresponding template rendering in `IframeController`

### Extending WebSocket Events
- All Socket.IO logic centralized in `PollingGateway`
- Client connections automatically receive current poll state on connect
- Add new events by extending gateway methods and updating frontend templates

### Testing Changes
- Development server: `pnpm dev` (NestJS watch mode)
- Slides server: `pnpm slides` (Marp on port 3001)
- Test mobile interface via ngrok URL or localhost:3000
- Admin panel: localhost:3000/admin
- Presenter interface: localhost:3000/presenter

### Template Development
Templates use CDN resources (Socket.IO, Chart.js) for reliability. When modifying templates:
- Main app templates in `views/app/` for full interfaces
- Iframe templates in `views/iframe/` for Marp embedding
- Use Handlebars syntax for dynamic data injection
- Templates are automatically reloaded in development mode

### Docker Development
- `docker-compose up` for containerized development
- Polls and slides directories mounted as volumes for live editing
- Production configuration includes optional nginx reverse proxy