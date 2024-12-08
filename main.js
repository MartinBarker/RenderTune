// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const serve = require('electron-serve');
const loadURL = serve({ directory: 'build' });
const { autoUpdater } = require('electron-updater');

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
