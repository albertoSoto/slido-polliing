const { app, BrowserWindow, Menu, dialog, shell, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let serverProcess;

const isDev = process.env.NODE_ENV === 'development';
const serverPort = process.env.PORT || 3000;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
  });

  // Set up menu
  createMenu();

  // Load the presenter interface
  mainWindow.loadURL(`http://localhost:${serverPort}/presenter`);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Presentation',
          accelerator: 'CmdOrCtrl+N',
          click: () => createNewPresentation()
        },
        {
          label: 'Open Presentation Folder',
          accelerator: 'CmdOrCtrl+O',
          click: () => openPresentationFolder()
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Admin Panel',
          accelerator: 'CmdOrCtrl+A',
          click: () => openAdminPanel()
        },
        {
          label: 'Voting Page',
          accelerator: 'CmdOrCtrl+V',
          click: () => openVotingPage()
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => showAbout()
        },
        {
          label: 'Learn More',
          click: () => shell.openExternal('https://github.com/your-repo/slido-polling')
        }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });

    // Window menu
    template[3].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function startServer() {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, 'dist', 'main.js');
    
    serverProcess = spawn('node', [serverPath], {
      cwd: __dirname,
      env: { ...process.env, ELECTRON_APP: 'true' }
    });

    let serverReady = false;

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('Server:', output);
      
      if (output.includes('NestJS Server running') && !serverReady) {
        serverReady = true;
        setTimeout(resolve, 1000); // Give server time to fully initialize
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('Server Error:', data.toString());
    });

    serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
      if (!serverReady) {
        reject(new Error(`Server failed to start (exit code: ${code})`));
      }
    });

    serverProcess.on('error', (error) => {
      console.error('Failed to start server:', error);
      reject(error);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!serverReady) {
        reject(new Error('Server startup timeout'));
      }
    }, 30000);
  });
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

// Menu handlers
function createNewPresentation() {
  const { dialog } = require('electron');
  
  dialog.showSaveDialog(mainWindow, {
    title: 'Create New Presentation',
    defaultPath: path.join(__dirname, 'polls', 'my-presentation.md'),
    filters: [
      { name: 'Markdown Files', extensions: ['md'] }
    ]
  }).then(result => {
    if (!result.canceled && result.filePath) {
      const template = `---
title: "Welcome"
type: "intro"
---

# 🎉 My Interactive Presentation

Welcome to our live polling demonstration!

---

---
title: "Poll Question 1"
type: "poll"
poll:
  question: "Your question here?"
  options:
    - "Option 1"
    - "Option 2" 
    - "Option 3"
    - "Option 4"
---

# 📊 Your Poll Question

<!-- Poll will automatically start when this slide is shown -->

---

---
title: "Poll Results 1"
type: "results"
resultsFor: 0
---

# 📊 Results: Your Poll Question

<!-- Results chart will be automatically generated here -->

---

---
title: "Thank You"
type: "conclusion"
---

# 🙏 Thank You!

Thanks for participating!
`;

      fs.writeFileSync(result.filePath, template, 'utf8');
      shell.showItemInFolder(result.filePath);
    }
  });
}

function openPresentationFolder() {
  const pollsFolder = path.join(__dirname, 'polls');
  shell.showItemInFolder(pollsFolder);
}

function openAdminPanel() {
  shell.openExternal(`http://localhost:${serverPort}/admin`);
}

function openVotingPage() {
  shell.openExternal(`http://localhost:${serverPort}`);
}

function showAbout() {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'About Slido Polling',
    message: 'Slido Polling',
    detail: 'Real-time polling system for Marp presentations\n\nVersion: 1.0.0\nElectron: ' + process.versions.electron + '\nNode: ' + process.versions.node,
    buttons: ['OK']
  });
}

// App event handlers
app.whenReady().then(async () => {
  try {
    console.log('Starting Slido Polling...');
    
    // Ensure required directories exist
    const requiredDirs = ['polls', 'slides', 'public'];
    requiredDirs.forEach(dir => {
      const dirPath = path.join(__dirname, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
    
    // Start the server
    await startServer();
    console.log('Server started successfully');
    
    // Create the main window
    createWindow();
    
  } catch (error) {
    console.error('Failed to start application:', error);
    dialog.showErrorBox('Startup Error', `Failed to start the application: ${error.message}`);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  stopServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', (event) => {
  stopServer();
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, navigationURL) => {
    navigationEvent.preventDefault();
    shell.openExternal(navigationURL);
  });
});

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (url.startsWith('http://localhost:')) {
    // Ignore certificate errors on localhost
    event.preventDefault();
    callback(true);
  } else {
    // Use default behavior for other URLs
    callback(false);
  }
});