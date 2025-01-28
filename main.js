import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { app, BrowserWindow, ipcMain, protocol, session, dialog, Menu } from 'electron';
import { nativeImage } from 'electron';
import { execa } from 'execa';
import pkg from 'electron-updater';
import path from 'path';
import fs from 'fs';
import readline from 'readline';
import musicMetadata from 'music-metadata';
import sizeOf from 'image-size';
import os from 'node:os';

const { autoUpdater } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow;

// disable gpu acceleration
app.disableHardwareAcceleration();

// Define audio and image file extensions
const audioExtensions = ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac', 'aiff', 'wma', 'amr', 'opus', 'alac', 'pcm', 'mid', 'midi', 'aif', 'caf'];
const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'heif', 'heic', 'ico', 'svg', 'raw', 'cr2', 'nef', 'orf', 'arw', 'raf', 'dng', 'pef', 'sr2'];

// Custom protocol registration
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
  { scheme: 'localfile', privileges: { secure: true, standard: true } },
]);

app.whenReady().then(() => {

  // Register custom protocol to handle local files
  protocol.registerFileProtocol('localfile', (request, callback) => {
    const filePath = path.normalize(decodeURIComponent(request.url.replace('localfile://', '')));
    callback({ path: filePath });
  });


  protocol.registerBufferProtocol('thum', async (request, callback) => {
    const url = decodeURIComponent(request.url.replace('thum:///', ''));
    console.log('Thumbnail request for:', url);

    try {

      const fallbackImage = nativeImage.createFromPath(url).resize({ width: 200 });
      callback({
        mimeType: 'image/png',
        data: fallbackImage.toPNG(),
      });


      /* //https://github.com/electron/electron/issues/45102
      if (!fs.existsSync(url)) {
        throw new Error(`File not found: ${url}`);
      }
  
      const thumbnailSize = { width: 200, height: 200 }; // Only width matters on Windows
      const thumbnail = await nativeImage.createThumbnailFromPath(url, { width: thumbnailSize.width });
  
      callback({
        mimeType: 'image/png',
        data: thumbnail.toPNG(),
      });
      */
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      // Provide an empty buffer and a valid MIME type to avoid breaking the app
      callback({
        mimeType: 'image/png',
        data: Buffer.alloc(0), // Empty image buffer
      });


    }
  });

  createWindow();

  // Content security policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self'; script-src 'self' 'unsafe-inline' http://localhost:3000; style-src 'self' 'unsafe-inline' http://localhost:3000; connect-src 'self' http://localhost:3000; img-src 'self' data: blob: localfile: thum:; font-src 'self';"]
      }
    });
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    frame: false,
    width: 800,
    height: 600,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      devTools: true
    },
  });

  // load window
  
  mainWindow.loadURL(
    app.isPackaged ? `file://${path.join(__dirname, "../build/index.html")}` : 
    'http://localhost:3000'
    );
    
   /*
    const startUrl = process.env.ELECTRON_START_URL || url.format({
      pathname: path.join(__dirname, '../build/index.html'),
      protocol: 'file:',
      slashes: true
    });
    mainWindow.loadURL(startUrl);
*/

// macos only 
//mainWindow.loadURL(`file://${path.join(__dirname, '../build/index.html')}`);


  // Open the DevTools if in development mode
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('did-fail-load', () => {
    console.error('Failed to load app://./index.html');
  });

  setupAutoUpdater();
}

function setupAutoUpdater() {
  autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update_available');
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update_downloaded');
  });
}

// IPC event to run an FFmpeg command
const ffmpegProcesses = new Map();

ipcMain.on('run-ffmpeg-command', async (event, ffmpegArgs) => {
  try {
    var cmdArgsList = ffmpegArgs.cmdArgs;
    var duration = parseInt(ffmpegArgs.outputDuration, 10);
    var renderId = ffmpegArgs.renderId;
    console.log('Received FFmpeg command');
    console.log('duration:', duration);

    const ffmpegPath = getFfmpegPath();
    console.log('Using FFmpeg path:', ffmpegPath);
    if (!app.isPackaged) {
      //logStream.write(`FFmpeg command: ${ffmpegPath} ${cmdArgsList.join(' ')}\n`);
    }

    const process = execa(ffmpegPath, cmdArgsList);
    ffmpegProcesses.set(renderId, process);
    const rl = readline.createInterface({ input: process.stderr });

    let progress = 0;
    const outputBuffer = [];

    rl.on('line', (line) => {
      if (!app.isPackaged) {
        //console.log('FFmpeg output:', line);
        //logStream.write('FFmpeg output: ' + line + '\n');
      }

      outputBuffer.push(line);
      if (outputBuffer.length > 10) {
        outputBuffer.shift(); // Keep only the last 10 lines
      }
      const match = line.match(/time=([\d:.]+)/);
      if (match) {
        const elapsed = match[1].split(':').reduce((acc, time) => (60 * acc) + +time, 0);
        progress = duration ? Math.min((elapsed / duration) * 100, 100) : 0;
        progress = Math.round(progress);
        event.reply('ffmpeg-progress', {
          renderId: renderId,
          pid: process.pid,
          progress
        });
      }
    });

    const result = await process;
    event.reply('ffmpeg-output', { stdout: result.stdout, progress: 100 });
  } catch (error) {
    console.error('FFmpeg command failed:', error.message);
    if (!app.isPackaged) {
      //logStream.write('error.message: ' + error.message + '\n');
    }
    const errorOutput = error.stderr ? error.stderr.split('\n').slice(-10).join('\n') : 'No error details';
    event.reply('ffmpeg-error', { message: error.message, lastOutput: errorOutput, ffmpegPath: getFfmpegPath() });
  }
});

ipcMain.on('stop-ffmpeg-render', (event, { renderId }) => {
  console.log(`Received request to stop FFmpeg render with ID: ${renderId}`);
  const process = ffmpegProcesses.get(renderId);
  if (process) {
    console.log(`Stopping FFmpeg process with PID: ${process.pid}`);
    process.kill('SIGTERM');
    ffmpegProcesses.delete(renderId);
    console.log(`FFmpeg process with ID: ${renderId} stopped successfully`);
    event.reply('ffmpeg-stop-response', { renderId, status: 'Stopped successfully' });
  } else {
    console.log(`Error: FFmpeg process with ID: ${renderId} not found`);
    event.reply('ffmpeg-stop-response', { renderId, status: 'Error: Process not found' });
  }
});

ipcMain.on('pause-ffmpeg-render', (event, { renderId }) => {
  console.log(`Received request to pause FFmpeg render with ID: ${renderId}`);
  const process = ffmpegProcesses.get(renderId);
  if (process) {
    console.log(`Pausing FFmpeg process with PID: ${process.pid}`);
    process.kill('SIGSTOP'); // Use 'SIGSTOP' to pause the process
    console.log(`FFmpeg process with ID: ${renderId} paused successfully`);
    event.reply('ffmpeg-pause-response', { renderId, status: 'Paused successfully' });
  } else {
    console.log(`Error: FFmpeg process with ID: ${renderId} not found`);
    event.reply('ffmpeg-pause-response', { renderId, status: 'Error: Process not found' });
  }
});

ipcMain.on('resume-ffmpeg-render', (event, { renderId }) => {
  console.log(`Received request to resume FFmpeg render with ID: ${renderId}`);
  const process = ffmpegProcesses.get(renderId);
  if (process) {
    console.log(`Resuming FFmpeg process with PID: ${process.pid}`);
    process.kill('SIGCONT'); // Use 'SIGCONT' to resume the process
    console.log(`FFmpeg process with ID: ${renderId} resumed successfully`);
    event.reply('ffmpeg-resume-response', { renderId, status: 'Resumed successfully' });
  } else {
    console.log(`Error: FFmpeg process with ID: ${renderId} not found`);
    event.reply('ffmpeg-resume-response', { renderId, status: 'Error: Process not found' });
  }
});

// Function to determine FFmpeg path
function getFfmpegPath() {
  console.log('getFfmpegPath()')
  
  var arch = os.arch();
  var platform = process.platform;

  console.log('os.arch = ', arch)
  console.log('process.platform = ', platform)

  const components = ['ffmpeg', `${platform}-${arch}`];
  console.log('components = ', components)

  const exeName = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  let ffmpegPath;

  if (app.isPackaged) {
    // Production path
    if (process.platform === 'darwin' || process.platform === 'linux') {
      ffmpegPath = path.join(process.resourcesPath, exeName);
    } else if (process.platform === 'win32') {
      ffmpegPath = path.join(process.resourcesPath, 'resources', exeName);
    }
  } else {
    // development path
    const rootFolder = path.basename(path.resolve(__dirname));
    const platformFolder = process.platform === 'darwin' ? `${platform}-${arch}` : process.platform === 'win32' ? 'win32-x64' : 'linux-x64';
    ffmpegPath = path.join(__dirname, '..', rootFolder, 'ffmpeg', platformFolder, 'lib', exeName);
  }

  return ffmpegPath;
}


ipcMain.on('get-audio-metadata', async (event, filePath) => {
  try {
    console.log('Getting metadata for file:', filePath);

    console.log('Raw filePath:', filePath);
    console.log('Encoded filePath:', encodeURI(filePath));
    console.log('Decoded filePath:', decodeURI(encodeURI(filePath)));


    const metadata = await musicMetadata.parseFile(filePath);
    event.sender.send('audio-metadata-response', {
      filepath: filePath,
      filename: path.basename(filePath), // Use `filename`
      duration: metadata.format.duration,
    });
  } catch (error) {
    console.log('Failed to get metadata for file:', filePath);
    event.sender.send('audio-metadata-response', {
      filepath: filePath,
      filename: path.basename(filePath), // Use `filename`
      error: 'Failed to get metadata',
    });
  }
});

ipcMain.on('open-folder-dialog', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (!result.canceled) {
    event.reply('selected-folder', result.filePaths[0]);
  }
});

ipcMain.on('open-file-dialog', async (event) => {

  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const fileInfoArray = await Promise.all(
        result.filePaths.map(async (filePath) => {
          const normalizedPath = path.normalize(filePath);
          const ext = path.extname(normalizedPath).toLowerCase().substring(1);
          let fileType = 'other';
          let dimensions = null;

          if (audioExtensions.includes(ext)) {
            fileType = 'audio';
          } else if (imageExtensions.includes(ext)) {
            fileType = 'image';
            try {
              const metadata = sizeOf(normalizedPath);
              dimensions = `${metadata.width}x${metadata.height}`;
            } catch (error) {
              console.error('Error reading image dimensions:', error);
            }
          }

          return {
            filename: path.basename(normalizedPath),
            filepath: normalizedPath,
            filetype: fileType,
            dimensions,
          };
        })
      );

      event.sender.send('selected-file-paths', fileInfoArray);
    }
  } catch (error) {
    console.error('Error opening file dialog:', error);
  }
});


ipcMain.on('get-path-separator', (event) => {
  const separator = path.sep; // Get OS-specific path separator
  event.reply('path-separator-response', separator); // Send back the separator
});

// Existing IPC events
ipcMain.on('app_version', (event) => {
  event.sender.send('app_version', { version: app.getVersion() });
});

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});

ipcMain.on('close-window', function () {
  if (mainWindow) {
    mainWindow.close();
    app.quit();
  }
});

ipcMain.on('minimize-window', function () {
  if (mainWindow && mainWindow.minimizable) {
    mainWindow.minimize();
  }
});

ipcMain.on('maximize-window', function () {
  if (mainWindow && mainWindow.maximizable) {
    mainWindow.maximize();
  }
});

ipcMain.on('unmaximize-window', function () {
  if (mainWindow) {
    mainWindow.unmaximize();
  }
});

ipcMain.on('delete-render-file', async (event, { outputFilePath }) => {
  try {
    if (fs.existsSync(outputFilePath)) {
      fs.unlinkSync(outputFilePath);
      console.log(`Deleted file: ${outputFilePath}`);
    } else {
      console.log(`File not found: ${outputFilePath}`);
    }
  } catch (error) {
    console.error(`Error deleting file: ${outputFilePath}`, error);
  }
});
