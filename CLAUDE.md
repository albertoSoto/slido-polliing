# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Slido Polling** - a real-time interactive polling system for Marp presentations. It allows presenters to create live polls that audiences can participate in via mobile devices using QR codes, with automatic ngrok tunneling for public access.

### Architecture

- **Express Server** (`server.js`): Main backend handling WebSocket connections, poll management, and API endpoints
- **Electron App** (`electron-main.js`): Desktop wrapper that starts the server and provides a presenter interface
- **Three Web Interfaces** (`public/`):
  - `vote.html`: Mobile-optimized voting interface for audiences
  - `presenter.html`: Presenter control panel for managing slides and polls
  - `admin.html`: Administrative interface for poll management
- **Markdown-Driven Presentations** (`polls/`): Presentations are defined in Markdown with YAML frontmatter for poll configuration

### Key Technologies
- Socket.IO for real-time communication
- QR code generation for mobile voting
- ngrok integration for public access
- YAML frontmatter parsing for poll configuration
- Chart.js for results visualization
- Electron for desktop app packaging

## Development Commands

**This project uses pnpm as the package manager.**

```bash
# Package management
pnpm install            # Install dependencies
pnpm add <package>      # Add dependency
pnpm add -D <package>   # Add dev dependency

# Development server with auto-reload
pnpm run dev
# or: pnpm dev

# Production server
pnpm start

# Generate Marp slides with live reload (serves on port 3001)
pnpm run slides

# Desktop app development
pnpm run electron-dev

# Desktop app production
pnpm run electron

# Build desktop installers
pnpm run build-all      # All platforms
pnpm run build         # Current platform only

# Docker development
docker-compose up

# Docker production with nginx
docker-compose --profile production up
```

## Architecture Deep Dive

### Poll System
- Polls are created from Markdown files in `polls/` directory
- Each slide can have YAML frontmatter defining poll questions and options
- Server parses presentations using `parsePresentationFile()` in server.js:222
- Real-time updates via Socket.IO events: `poll-started`, `vote-update`, `poll-stopped`

### Presentation Navigation
- Slides are navigated via `/api/presentation/navigate/:direction` endpoint
- When reaching a poll slide, the server automatically starts the poll
- Results slides (`type: "results"`) automatically display charts for associated polls

### WebSocket Events
Key Socket.IO events handled in server.js:209-219:
- `poll-started`: New poll begins
- `vote-update`: Real-time vote counting
- `poll-stopped`: Poll ends
- `slide-changed`: Presenter navigation

### API Endpoints
Core REST endpoints in server.js:
- `POST /api/poll`: Create manual poll
- `GET /api/poll/:id`: Get poll data  
- `POST /api/vote/:pollId/:optionId`: Submit vote
- `GET /api/qr/:pollId`: Generate QR code
- `GET /api/presentation/load/:filename`: Load presentation from polls/
- `POST /api/presentation/navigate/:direction`: Navigate slides

### Environment Configuration
Uses `.env` file for configuration (see `.env.example`):
- `PORT`: Server port (default 3000)
- `NGROK_AUTHTOKEN`: Optional ngrok authentication
- `NODE_ENV`: Environment mode
- `ELECTRON_APP`: Set to true when running via Electron

### File Structure
```
polls/                  # Markdown presentations
  ├── sample-presentation.md
public/                 # Web interfaces
  ├── vote.html        # Mobile voting UI
  ├── presenter.html   # Presenter controls
  └── admin.html       # Admin interface
slides/                 # Marp slide templates
  ├── presentation.md
  └── polling-theme.css
```

## Development Notes

### Adding New Poll Types
- Poll configuration is defined in YAML frontmatter of Markdown slides
- Parser handles both frontmatter polls and inline `<!-- poll: -->` comments
- New poll types require updates to `parsePresentationFile()` function

### Extending WebSocket Events
- All Socket.IO logic is centralized in server.js:209-219
- Client connections automatically receive current poll state on connect
- Add new events by extending the `io.on('connection')` handler

### Testing Changes
- Start development server: `npm run dev`
- Test mobile interface via ngrok URL or localhost:3000
- Use presenter interface at localhost:3000/presenter
- Admin panel available at localhost:3000/admin

### Docker Development
- Use `docker-compose up` for containerized development
- Polls and slides directories are mounted as volumes for live editing
- Production configuration includes optional nginx reverse proxy