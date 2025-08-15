# 📊 Slido Polling - Interactive Presentation System

A complete real-time polling system built with **NestJS and TypeScript** featuring automatic poll activation, mobile voting via QR codes, and live results visualization. Create interactive presentations with YAML-driven poll configuration.

## ✨ Features

- **🚀 Auto-Activation**: Polls start/stop automatically when navigating slides
- **📱 Mobile-First Voting**: QR codes with ngrok URLs for instant audience participation
- **🆔 Custom Poll IDs**: Use meaningful identifiers instead of numeric indices
- **📝 YAML-Driven**: Define polls directly in Markdown frontmatter
- **📊 Live Results**: Real-time charts and vote counting
- **🎯 Smart Presenter Interface**: Dropdown presentation selection with auto-discovery
- **🌐 Public Access**: Automatic ngrok tunneling for remote audiences
- **💻 Desktop App**: Cross-platform Electron application
- **⚡ Real-time Updates**: WebSocket communication for instant feedback

## 🚀 Quick Start

### Option 1: Node.js (Development)

```bash
# Clone the repository
git clone <your-repo-url>
cd slido-polling

# Install dependencies (uses pnpm)
pnpm install

# Start the development server
pnpm dev
```

Visit:
- **Presenter**: http://localhost:3000/presenter
- **Admin**: http://localhost:3000/admin  
- **Voting**: http://localhost:3000

### Option 2: Docker (Production)

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t slido-polling .
docker run -p 3000:3000 -v $(pwd)/polls:/app/polls slido-polling
```

### Option 3: Desktop App (Electron)

```bash
# Install dependencies
pnpm install

# Run the desktop app
pnpm electron

# Build installers
pnpm electron:build-all
```

## 📝 Creating Presentations

Create a Markdown file in the `polls/` directory with YAML frontmatter:

```markdown
---
title: "Welcome Slide"
type: "intro"
---

# 🎉 My Interactive Presentation

Welcome everyone!

---
title: "First Poll"
type: "poll"
poll:
  id: "favorite-color"  # Custom poll ID
  question: "What's your favorite color?"
  options:
    - "Red"
    - "Blue" 
    - "Green"
    - "Yellow"
---

# QR code and poll content auto-generated!

---
title: "Results"
type: "results"
resultsFor: "favorite-color"  # References poll ID
---

# 📊 Color Results

Poll results auto-generated with vote counts!
```

**Key Features:**
- **Auto-Generated Content**: Poll slides create QR codes and display automatically
- **Custom Poll IDs**: Use meaningful identifiers like `"user-satisfaction"`
- **Auto-Activation**: Polls start when you navigate to poll slides
- **Auto-Stopping**: Polls end when you reach results slides

## 🎮 Usage

### 1. Load Presentation
1. Open the **Presenter** interface (`localhost:3000/presenter`)
2. Select presentation from the dropdown (auto-discovers `.md` files in `polls/`)
3. Click "Load Presentation"

### 2. Navigate Slides
- Use **Previous/Next** buttons
- **Polls start automatically** when you reach poll slides
- **Results update in real-time** via WebSocket
- **Polls stop automatically** when you reach results slides

### 3. Share with Audience
- **QR Code** appears automatically with ngrok URL for each poll
- **Public access** via automatic ngrok tunneling
- **Mobile-optimized** voting interface
- **Real-time vote counting** visible to presenter

## 🛠️ Configuration

### Environment Variables

```bash
# Server port (default: 3000)
PORT=3000

# ngrok authentication token (REQUIRED for public access)
NGROK_AUTHTOKEN=your_token_here

# Development mode
NODE_ENV=development
```

### ngrok Setup (Required for Mobile Access)

1. Sign up at [ngrok.com](https://ngrok.com)
2. Get your auth token from the dashboard
3. Add `NGROK_AUTHTOKEN=your_token_here` to your `.env` file
4. Public URLs generated automatically on startup!

## 📁 Project Structure

```
slido-polling/
├── src/                   # NestJS TypeScript backend
│   ├── app.module.ts     # Main application module
│   ├── polling/          # Poll management & WebSocket
│   ├── presentation/     # Markdown parsing & navigation
│   ├── common/           # Shared services (NgrokService)
│   └── main.ts          # Application bootstrap
├── views/                # Handlebars templates
│   ├── app/             # Main interfaces (vote, admin, presenter)
│   └── iframe/          # Embeddable components
├── polls/                # Markdown presentations with YAML
│   └── sample-presentation.md
├── electron-main.js      # Electron wrapper
├── package.json          # pnpm scripts & dependencies
├── .env                 # Environment variables
└── assets/              # App icons
```

## 🔧 Scripts

```bash
# Development (NestJS with auto-reload)
pnpm dev                  # Development server with watch mode
pnpm debug               # Debug mode with breakpoints

# Production
pnpm build               # Build NestJS application  
pnpm start               # Production server

# Electron Desktop App
pnpm electron:dev        # Development with hot reload
pnpm electron           # Production desktop app
pnpm electron:build     # Build installer (current platform)
pnpm electron:build-all # Build for all platforms

# Docker
docker-compose up        # Run with Docker
```

## 📊 API Reference

### Presentation Management
- `GET /api/presentation/load/:filename` - Load presentation from `polls/` directory
- `POST /api/presentation/navigate/:direction` - Navigate slides (auto-starts/stops polls)
- `GET /api/presentation/state` - Get current presentation state

### Polling (Auto-managed)
- `POST /api/vote/:pollId/:optionId` - Submit vote (primary endpoint for mobile)
- `GET /api/qr/:pollId` - Generate QR code PNG with ngrok URL

### Manual Poll Management
- `POST /api/poll` - Create manual poll (admin use)
- `GET /api/poll/:id` - Get poll data
- `POST /api/poll/:id/stop` - Manually stop poll

## 🌐 WebSocket Events

Real-time communication via Socket.IO:

```javascript
// Automatic events from poll navigation
socket.on('poll-started', (poll) => { 
  // Poll auto-started when presenter navigates to poll slide
  console.log('New poll:', poll.question, poll.options);
});

socket.on('vote-update', (poll) => { 
  // Real-time vote counting
  console.log('Vote received:', poll.totalVotes);
});

socket.on('poll-stopped', (poll) => { 
  // Poll auto-stopped when presenter navigates to results slide
  console.log('Poll ended:', poll.id);
});

socket.on('slide-changed', (data) => { 
  // Presenter navigation triggers poll lifecycle
  console.log('Slide changed:', data.slideIndex, data.currentSlide.title);
});
```

## 🚨 Troubleshooting

### ngrok Issues
- Ensure you have an ngrok account and auth token
- Check firewall settings
- Verify port 3000 is available

### Docker Issues
```bash
# Reset everything
docker-compose down -v
docker-compose up --build
```

### Electron Build Issues
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- **Marp** for beautiful slide presentations
- **Socket.IO** for real-time communication
- **Chart.js** for data visualization
- **ngrok** for public tunneling
- **Electron** for desktop applications

---

**Happy Presenting! 🎉**

For support, please open an issue on GitHub.