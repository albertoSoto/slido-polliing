---
marp: true
theme: polling
class: lead
paginate: true
---

<!-- _class: title -->

# 🎉 Interactive Presentation

## Live Polling Demo

**Get your phones ready!**

---

<!-- _class: poll -->
<!-- poll:
question: "What's your favorite programming language?"
options:
  - "JavaScript"
  - "Python"
  - "Java"
  - "C++"
  - "Other"
-->

# 💻 Programming Languages

## Scan the QR code to vote!

<div id="qr-container"></div>

---

<!-- _class: results -->

# 📊 Results: Programming Languages

<div id="results-container">
  <canvas id="results-chart"></canvas>
</div>

---

<!-- _class: poll -->
<!-- poll:
question: "How do you prefer to learn new technologies?"
options:
  - "Online courses"
  - "Documentation"
  - "Video tutorials"
  - "Books"
  - "Hands-on projects"
-->

# 📚 Learning Preferences

## Let's see how our audience likes to learn!

<div id="qr-container"></div>

---

<!-- _class: results -->

# 📊 Results: Learning Preferences

<div id="results-container">
  <canvas id="results-chart"></canvas>
</div>

---

<!-- _class: conclusion -->

# 🙏 Thank You!

Thanks for participating in our interactive presentation.

Your feedback helps us create better content!

---

<style>
:root {
  --primary-color: #007acc;
  --secondary-color: #667eea;
  --success-color: #28a745;
  --background-color: #f8f9fa;
  --text-color: #333;
}

section {
  background: linear-gradient(135deg, var(--secondary-color) 0%, var(--primary-color) 100%);
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

section.title {
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

section.poll {
  text-align: center;
}

section.results {
  text-align: center;
}

section.conclusion {
  text-align: center;
  background: linear-gradient(135deg, var(--success-color) 0%, #20c997 100%);
}

h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

h2 {
  font-size: 1.5rem;
  opacity: 0.9;
  margin-bottom: 2rem;
}

#qr-container {
  margin: 2rem 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

#results-container {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin: 2rem auto;
  max-width: 80%;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

#results-chart {
  max-width: 100%;
  height: 400px;
}

.poll-info {
  background: rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 2rem 0;
  backdrop-filter: blur(10px);
}

footer {
  position: absolute;
  bottom: 20px;
  right: 20px;
  font-size: 0.8rem;
  opacity: 0.7;
}
</style>

<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
// This script will be injected into Marp slides
class SlidoPolling {
  constructor() {
    this.socket = null;
    this.currentPoll = null;
    this.currentChart = null;
    this.init();
  }

  init() {
    // Connect to WebSocket server
    this.socket = io();
    
    this.socket.on('poll-started', (poll) => {
      this.handlePollStarted(poll);
    });
    
    this.socket.on('vote-update', (poll) => {
      this.handleVoteUpdate(poll);
    });
    
    this.socket.on('poll-stopped', (poll) => {
      this.handlePollStopped(poll);
    });
    
    // Initialize slide interactions
    this.initializeSlides();
  }
  
  initializeSlides() {
    // Find slides with polls
    const pollSlides = document.querySelectorAll('section.poll');
    pollSlides.forEach(slide => {
      const pollComment = slide.innerHTML.match(/<!-- poll:([\s\S]*?)-->/);
      if (pollComment) {
        try {
          // Parse YAML-like poll definition
          const pollData = this.parseSimpleYAML(pollComment[1]);
          this.setupPollSlide(slide, pollData);
        } catch (e) {
          console.warn('Failed to parse poll data:', e);
        }
      }
    });
    
    // Find result slides
    const resultSlides = document.querySelectorAll('section.results');
    resultSlides.forEach(slide => {
      this.setupResultSlide(slide);
    });
  }
  
  parseSimpleYAML(yamlString) {
    const lines = yamlString.split('\n').map(line => line.trim()).filter(line => line);
    const result = {};
    let currentKey = null;
    let currentArray = null;
    
    lines.forEach(line => {
      if (line.includes(':') && !line.startsWith('-')) {
        const [key, value] = line.split(':').map(s => s.trim());
        if (value.startsWith('"') && value.endsWith('"')) {
          result[key] = value.slice(1, -1);
        } else if (value) {
          result[key] = value;
        } else {
          currentKey = key;
          currentArray = [];
          result[key] = currentArray;
        }
      } else if (line.startsWith('-') && currentArray) {
        const value = line.substring(1).trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          currentArray.push(value.slice(1, -1));
        } else {
          currentArray.push(value);
        }
      }
    });
    
    return result;
  }
  
  setupPollSlide(slide, pollData) {
    const qrContainer = slide.querySelector('#qr-container');
    if (qrContainer && pollData.question) {
      // Create poll info display
      const pollInfo = document.createElement('div');
      pollInfo.className = 'poll-info';
      pollInfo.innerHTML = `
        <h3>📊 ${pollData.question}</h3>
        <p>Options: ${pollData.options.join(', ')}</p>
        <div id="qr-code-display"></div>
        <p><strong>Visit the URL or scan QR code to vote!</strong></p>
      `;
      qrContainer.appendChild(pollInfo);
    }
  }
  
  setupResultSlide(slide) {
    const resultsContainer = slide.querySelector('#results-container');
    if (resultsContainer) {
      resultsContainer.innerHTML = `
        <div id="no-results" style="color: #666; padding: 2rem;">
          <h3>No poll results available</h3>
          <p>Start a poll from the previous slide to see results here.</p>
        </div>
        <canvas id="results-chart" style="display: none;"></canvas>
      `;
    }
  }
  
  handlePollStarted(poll) {
    this.currentPoll = poll;
    
    // Update QR codes on poll slides
    this.updateQRCodes(poll.id);
    
    // Show poll started indicator
    this.showNotification(`📊 Poll Started: ${poll.question}`, 'success');
  }
  
  handleVoteUpdate(poll) {
    if (this.currentPoll && this.currentPoll.id === poll.id) {
      this.currentPoll = poll;
      this.updateResultCharts();
    }
  }
  
  handlePollStopped(poll) {
    if (this.currentPoll && this.currentPoll.id === poll.id) {
      this.currentPoll = poll;
      this.showNotification(`⏹️ Poll Stopped: ${poll.question}`, 'info');
    }
  }
  
  async updateQRCodes(pollId) {
    try {
      const response = await fetch(`/api/qr/${pollId}`);
      const data = await response.json();
      
      const qrDisplays = document.querySelectorAll('#qr-code-display');
      qrDisplays.forEach(display => {
        display.innerHTML = `
          <img src="${data.qrCode}" style="max-width: 200px; background: white; padding: 10px; border-radius: 8px; margin: 1rem 0;">
          <br>
          <code style="font-size: 0.8rem; background: rgba(0,0,0,0.1); padding: 0.5rem; border-radius: 4px;">
            ${data.voteUrl}
          </code>
        `;
      });
    } catch (error) {
      console.error('Failed to load QR code:', error);
    }
  }
  
  updateResultCharts() {
    if (!this.currentPoll) return;
    
    const resultCharts = document.querySelectorAll('#results-chart');
    resultCharts.forEach(canvas => {
      if (canvas.style.display === 'none') {
        canvas.style.display = 'block';
        const noResults = canvas.parentElement.querySelector('#no-results');
        if (noResults) noResults.style.display = 'none';
      }
      
      const ctx = canvas.getContext('2d');
      
      if (this.currentChart) {
        this.currentChart.destroy();
      }
      
      const labels = this.currentPoll.options.map(opt => opt.text);
      const data = this.currentPoll.options.map(opt => opt.votes);
      
      this.currentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: [
              '#FF6384',
              '#36A2EB', 
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40'
            ].slice(0, data.length),
            borderWidth: 3,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: `${this.currentPoll.question} (${this.currentPoll.totalVotes} votes)`,
              font: { size: 18, weight: 'bold' },
              color: '#333'
            },
            legend: {
              position: 'bottom',
              labels: {
                font: { size: 14 },
                color: '#333',
                padding: 20
              }
            }
          }
        }
      });
    });
  }
  
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#28a745' : '#007acc'};
      color: white;
      padding: 1rem 2rem;
      border-radius: 8px;
      font-weight: bold;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.style.transform = 'translateX(0)', 100);
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SlidoPolling();
  });
} else {
  new SlidoPolling();
}
</script>