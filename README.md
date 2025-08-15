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

Create a Markdown file in the `polls/` directory:

```markdown
---
title: "Welcome Slide"
type: "intro"
---

# 🎉 My Interactive Presentation

Welcome everyone!

---

---
title: "First Poll"
type: "poll"
poll:
  question: "What's your favorite color?"
  options:
    - "Red"
    - "Blue" 
    - "Green"
    - "Yellow"
---

# 🎨 Color Preference

Scan the QR code to vote!

---

---
title: "Results"
type: "results"
resultsFor: 0
---

# 📊 Color Results

Results will appear here automatically!
```

## 🎮 Usage

### 1. Load Presentation
1. Open the **Presenter** interface
2. Enter your presentation filename (without .md)
3. Click "Load Presentation"

### 2. Navigate Slides
- Use **Previous/Next** buttons
- Polls start automatically when you reach poll slides
- Results update in real-time

### 3. Share with Audience
- **QR Code** appears automatically for each poll
- **ngrok URL** provides public access
- Mobile-optimized voting interface

## 🛠️ Configuration

### Environment Variables

```bash
# Server port (default: 3000)
PORT=3000

# ngrok authentication token (optional)
NGROK_AUTHTOKEN=your_token_here

# Development mode
NODE_ENV=development
```

### ngrok Setup (Optional)

1. Sign up at [ngrok.com](https://ngrok.com)
2. Get your auth token
3. Set `NGROK_AUTHTOKEN` environment variable
4. Enjoy public URLs automatically!

## 📁 Project Structure

```
slido-polling/
├── server.js              # Main server
├── electron-main.js       # Electron main process
├── package.json           # Dependencies & scripts
├── Dockerfile             # Container build
├── docker-compose.yml     # Container orchestration
├── polls/                 # Markdown presentations
│   └── sample-presentation.md
├── slides/                # Marp templates
│   ├── presentation.md
│   └── polling-theme.css
├── public/                # Web interfaces
│   ├── vote.html         # Mobile voting
│   ├── admin.html        # Poll management
│   └── presenter.html    # Presenter control
└── assets/               # App icons
    └── icon.png
```

## 🔧 Scripts

```bash
# Development
npm run dev                # Server with auto-reload
npm run slides            # Marp slides with live reload

# Production
npm start                 # Production server

# Electron
npm run electron          # Desktop app
npm run electron-dev      # Desktop app with dev server
npm run build             # Build installers (current platform)
npm run build-all         # Build for all platforms

# Docker
docker-compose up         # Run with Docker
```

## 📊 API Reference

### Presentation Management
- `GET /api/presentation/load/:filename` - Load presentation
- `POST /api/presentation/navigate/:direction` - Navigate slides
- `GET /api/presentation/state` - Current state

### Polling
- `POST /api/poll` - Create poll
- `GET /api/poll/:id` - Get poll data
- `POST /api/vote/:pollId/:optionId` - Submit vote
- `POST /api/poll/:id/stop` - Stop poll

### QR Codes
- `GET /api/qr/:pollId` - Generate QR code

## 🌐 WebSocket Events

```javascript
// Client events
socket.on('poll-started', (poll) => { /* New poll */ });
socket.on('vote-update', (poll) => { /* Vote received */ });
socket.on('poll-stopped', (poll) => { /* Poll ended */ });
socket.on('slide-changed', (data) => { /* Slide navigation */ });
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