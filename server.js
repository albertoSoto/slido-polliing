const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const ngrok = require('ngrok');
const { marked } = require('marked');
const yaml = require('yaml');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let polls = new Map();
let currentPoll = null;
let ngrokUrl = null;
let presentationPolls = [];
let currentSlideIndex = 0;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'vote.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/presenter', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'presenter.html'));
});

app.post('/api/poll', (req, res) => {
  const { question, options } = req.body;
  const pollId = Date.now().toString();
  
  const poll = {
    id: pollId,
    question,
    options: options.map((option, index) => ({
      id: index,
      text: option,
      votes: 0
    })),
    active: true,
    totalVotes: 0
  };
  
  polls.set(pollId, poll);
  currentPoll = pollId;
  
  io.emit('poll-started', poll);
  
  res.json({ 
    pollId, 
    qrUrl: `http://localhost:3000/vote/${pollId}`,
    poll 
  });
});

app.get('/api/poll/:id', (req, res) => {
  const poll = polls.get(req.params.id);
  if (!poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }
  res.json(poll);
});

app.post('/api/vote/:pollId/:optionId', (req, res) => {
  const { pollId, optionId } = req.params;
  const poll = polls.get(pollId);
  
  if (!poll || !poll.active) {
    return res.status(400).json({ error: 'Poll not found or inactive' });
  }
  
  const option = poll.options.find(opt => opt.id === parseInt(optionId));
  if (!option) {
    return res.status(400).json({ error: 'Invalid option' });
  }
  
  option.votes++;
  poll.totalVotes++;
  
  io.emit('vote-update', poll);
  
  res.json({ success: true, poll });
});

app.post('/api/poll/:id/stop', (req, res) => {
  const poll = polls.get(req.params.id);
  if (!poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }
  
  poll.active = false;
  io.emit('poll-stopped', poll);
  
  res.json({ success: true });
});

app.get('/vote/:pollId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'vote.html'));
});

app.get('/api/qr/:pollId', async (req, res) => {
  try {
    const baseUrl = ngrokUrl || `http://localhost:3000`;
    const voteUrl = `${baseUrl}/vote/${req.params.pollId}`;
    const qrCode = await QRCode.toDataURL(voteUrl);
    res.json({ qrCode, voteUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Load presentation polls from markdown
app.get('/api/presentation/load/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, 'polls', `${filename}.md`);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Presentation file not found' });
    }
    
    const content = fs.readFileSync(filepath, 'utf8');
    const parsedPolls = parsePresentationFile(content);
    
    presentationPolls = parsedPolls;
    currentSlideIndex = 0;
    
    res.json({ 
      polls: parsedPolls,
      totalSlides: parsedPolls.length,
      currentSlide: currentSlideIndex 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load presentation' });
  }
});

// Navigate presentation
app.post('/api/presentation/navigate/:direction', (req, res) => {
  const direction = req.params.direction;
  
  if (direction === 'next' && currentSlideIndex < presentationPolls.length - 1) {
    currentSlideIndex++;
  } else if (direction === 'prev' && currentSlideIndex > 0) {
    currentSlideIndex--;
  }
  
  const currentSlide = presentationPolls[currentSlideIndex];
  
  // If current slide has a poll, start it
  if (currentSlide && currentSlide.poll) {
    const pollId = Date.now().toString();
    const poll = {
      id: pollId,
      question: currentSlide.poll.question,
      options: currentSlide.poll.options.map((option, index) => ({
        id: index,
        text: option,
        votes: 0
      })),
      active: true,
      totalVotes: 0,
      slideIndex: currentSlideIndex
    };
    
    polls.set(pollId, poll);
    currentPoll = pollId;
    io.emit('poll-started', poll);
  }
  
  io.emit('slide-changed', { 
    slideIndex: currentSlideIndex, 
    slide: currentSlide,
    totalSlides: presentationPolls.length 
  });
  
  res.json({ 
    slideIndex: currentSlideIndex, 
    slide: currentSlide,
    totalSlides: presentationPolls.length 
  });
});

// Get current presentation state
app.get('/api/presentation/state', (req, res) => {
  res.json({
    slideIndex: currentSlideIndex,
    totalSlides: presentationPolls.length,
    currentSlide: presentationPolls[currentSlideIndex] || null,
    ngrokUrl: ngrokUrl
  });
});

io.on('connection', (socket) => {
  console.log('Client connected');
  
  if (currentPoll && polls.get(currentPoll)) {
    socket.emit('poll-started', polls.get(currentPoll));
  }
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Parse presentation markdown file
function parsePresentationFile(content) {
  const slides = [];
  const sections = content.split(/^---$/gm);
  
  sections.forEach((section, index) => {
    const trimmed = section.trim();
    if (!trimmed) return;
    
    // Check for YAML frontmatter
    const yamlMatch = trimmed.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    let frontmatter = {};
    let slideContent = trimmed;
    
    if (yamlMatch) {
      try {
        frontmatter = yaml.parse(yamlMatch[1]);
        slideContent = yamlMatch[2];
      } catch (e) {
        console.warn('Failed to parse YAML frontmatter:', e);
      }
    }
    
    const slide = {
      id: index,
      content: slideContent,
      type: frontmatter.type || 'content',
      title: frontmatter.title || extractTitle(slideContent),
      ...frontmatter
    };
    
    // Parse poll data if present
    if (frontmatter.poll) {
      slide.poll = frontmatter.poll;
    } else if (slideContent.includes('<!-- poll:')) {
      const pollMatch = slideContent.match(/<!-- poll:\s*([\s\S]*?)\s*-->/);
      if (pollMatch) {
        try {
          slide.poll = yaml.parse(pollMatch[1]);
        } catch (e) {
          console.warn('Failed to parse poll YAML:', e);
        }
      }
    }
    
    slides.push(slide);
  });
  
  return slides;
}

function extractTitle(content) {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  return titleMatch ? titleMatch[1] : 'Untitled Slide';
}

// Initialize ngrok tunnel
async function initializeNgrok() {
  try {
    const url = await ngrok.connect({
      addr: PORT,
      authtoken_from_env: true
    });
    ngrokUrl = url;
    console.log(`🌐 Public URL: ${url}`);
    console.log(`📱 Mobile voting: ${url}`);
    console.log(`⚙️  Admin panel: ${url}/admin`);
    return url;
  } catch (error) {
    console.warn('⚠️  Failed to start ngrok tunnel:', error.message);
    console.log('📱 Using local URLs only');
    return null;
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
  console.log(`📱 Voting page: http://localhost:${PORT}`);
  
  // Create required directories
  const requiredDirs = ['polls', 'slides'];
  requiredDirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
  
  // Initialize ngrok
  await initializeNgrok();
});