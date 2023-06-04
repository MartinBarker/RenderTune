// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const serve = require('electron-serve');
const loadURL = serve({ directory: 'build' });
const { autoUpdater } = require('electron-updater');
const express = require('express');
const http = require('http');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let server;
let apiServerPort = 3001;

function isDev() {
  return !app.isPackaged;
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    backgroundColor: '#FFF',
    webPreferences: {
      // Set a Content Security Policy for the renderer process
      // This example allows scripts and styles only from the same origin
      // You should customize this policy to fit your app's needs
      contentSecurityPolicy: "default-src 'self'; script-src 'self'; style-src 'self';",
      enableRemoteModule: true,
      nodeIntegration: true,
      contextIsolation: false
    },
    // Use this in development mode.
    icon: isDev() ? path.join(process.cwd(), 'public/logo512.png') : path.join(__dirname, 'build/logo512.png'),
    // Use this in production mode.
    // icon: path.join(__dirname, 'build/logo512.png'),
    show: false
  });

  //start listening for http requests
  startServer(apiServerPort)

  // This block of code is intended for development purpose only.
  // Delete this entire block of code when you are ready to package the application.
  if (isDev()) {
    mainWindow.loadURL('http://localhost:3000/');
  } else {
    loadURL(mainWindow);
  }

  // Uncomment the following line of code when app is ready to be packaged.
  // loadURL(mainWindow);

  // Open the DevTools and also disable Electron Security Warning.
  // process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true;
  // mainWindow.webContents.openDevTools();

  mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  });

  // Emitted when the window is ready to be shown
  // This helps in showing the window gracefully.
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    autoUpdater.checkForUpdatesAndNotify();
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  stopServer()
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
});

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
});

//
// App verison update functions
//
ipcMain.on('app_version', (event) => {
  event.sender.send('app_version', { version: app.getVersion() });
})
ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});
autoUpdater.on('update-available', () => {
  mainWindow.webContents.send('update_available');
});
autoUpdater.on('update-downloaded', () => {
  mainWindow.webContents.send('update_downloaded');
});

//
// App window controls functions
//

// Register an event listener. When ipcRenderer sends a request to minimize the window; minimize the window if possible.
ipcMain.on(`minimize-window`, function (e, args) {
  if (mainWindow) {
    if (mainWindow.minimizable) {
      // browserWindow.isMinimizable() for old electron versions
      mainWindow.minimize();
    }
  }
});

// Register an event listener. When ipcRenderer sends a request to maximize he window; maximize the window if possible.
ipcMain.on(`maximize-window`, function (e, args) {
  if (mainWindow) {
    if (mainWindow.maximizable) {
      // browserWindow.isMinimizable() for old electron versions
      mainWindow.maximize();
    }
  }
});

// Register an event listener. When ipcRenderer sends a request to unmaximize the window, unmaximize the window.
ipcMain.on(`unmaximize-window`, function (e, args) {
  if (mainWindow) {
    mainWindow.unmaximize()
  }
});

// Register an event listener. When ipcRenderer sends a request to max-unmax the window; check if it is maximized and unmaximize it. Otherwise maximize it
ipcMain.on(`max-unmax-window`, function (e, args) {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

// Register an event listener. When ipcRenderer sends a request to close the window; close it
ipcMain.on(`close-window`, function (e, args) {
  if (mainWindow) {
    mainWindow.close();
    app.quit();
  }
});

//kill process
ipcMain.on('kill-process', async (event, pid) => {
  console.log('kill-process pid=', pid)
  try {

  } catch (err) {

  }
  return ('done')
});

//return apiServerPort
ipcMain.handle('get-api-server-port', async (event) => {
  return new Promise(async function (resolve, reject) {
    try {
      resolve(apiServerPort);
    } catch (err) {
      console.log('hor err=', err)
      reject(err)
    }
  })
})



ipcMain.handle('open-url', async (event, url) => {
  try {
    console.log(`open-url: ${url}`)
    await shell.openExternal(url);
    return 'URL opened successfully';
  } catch (err) {
    console.log('hor err=', err)
    throw err;
  }
});


function startServer(port) {
  // Create an Express app and attach it to a Node.js HTTP server
  const app = express();
  server = http.createServer(app);

  app.get('/', (req, res) => {
    res.send('Hello, World!');
  });

  app.get('/ytCode', async function (req, res) {
    //get code
    let code = req.url.toString().replace('/ytCode?code=', '')
    console.log('/code url detected: ', code)
    //authenticate online
    await fetch(`http://localhost:8080/getOauth2Client?token=${code}`)
    .then(response => response.json())
    .then(data => {
      console.log('data rsp:', data);
    })
    .catch(error => console.error('caught err=', error));
    
    res.send();
  });

  // Attempt to listen on the specified port
  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  // Handle errors if the port is already in use
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.log(`Port ${port} is already in use`);
      stopServer();

      // Find an available port and start the server on that port instead
      apiServerPort = port + 1
      startServer(port + 1);
    }
  });
}

function stopServer() {
  // Stop listening for incoming HTTP requests
  if (server) {
    server.close(() => {
      console.log('Server stopped');
    });
  }
}