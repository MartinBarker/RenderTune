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
import { Vibrant } from 'node-vibrant/node';

const { autoUpdater } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow;
let ffmpegProcesses = new Map();

// disable gpu acceleration
app.disableHardwareAcceleration();

// Define audio and image file extensions
const audioExtensions = ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac', 'aiff', 'wma', 'amr', 'opus', 'alac', 'pcm', 'mid', 'midi', 'aif', 'caf'];
const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'heif', 'heic', 'ico', 'svg', 'raw', 'cr2', 'nef', 'orf', 'arw', 'raf', 'dng', 'pef', 'sr2'];

const thumbnailCacheDir = path.join(os.tmpdir(), 'RenderTune-thumbnails');
if (!fs.existsSync(thumbnailCacheDir)) {
  fs.mkdirSync(thumbnailCacheDir, { recursive: true });
}
console.log(`Thumbnail cache directory is set to: ${thumbnailCacheDir}`);

const thumbnailMapPath = path.join(thumbnailCacheDir, 'thumbnails.json');
let thumbnailMap = {};
if (fs.existsSync(thumbnailMapPath)) {
  try {
    thumbnailMap = JSON.parse(fs.readFileSync(thumbnailMapPath, 'utf-8'));
  } catch (error) {
    console.error('Error parsing thumbnails.json:', error);
    thumbnailMap = {}; // Reset to an empty object if parsing fails
  }
}

function saveThumbnailMap() {
  fs.writeFileSync(thumbnailMapPath, JSON.stringify(thumbnailMap, null, 2));
}

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
      const thumbnailPath = path.join(thumbnailCacheDir, path.basename(url));
      console.log('Generated thumbnail path:', thumbnailPath);

      callback({
        mimeType: 'image/png',
        data: fallbackImage.toPNG(),
      });

    } catch (error) {
      console.error('Error generating thumbnail:', error);
      // Provide an empty buffer and a valid MIME type to avoid breaking the app
      callback({
        mimeType: 'image/png',
        data: Buffer.alloc(0), // Empty image buffer
      });
    }
  });

  ipcMain.on('get-color-palette', async (event, imagePath) => {
    try {
      console.log('Received request to get color palette for:', imagePath);

      const thumbnailPath = thumbnailMap[imagePath] || imagePath;
      console.log('Fetching color info using thumbnail path:', thumbnailPath);
      const swatches = await Vibrant.from(thumbnailPath).getPalette();
      let colors = {};

      for (const [key, value] of Object.entries(swatches)) {
        if (value) { // Ensure the swatch is not null/undefined
          const rgbColor = value.rgb;
          const hexColor = rgbToHex(rgbColor);
          colors[key] = { hex: hexColor, rgb: rgbColor };
        }
      }

      console.log('Extracted color palette:', colors.Vibrant.hex);
      event.reply(`color-palette-response-${imagePath}`, colors);
    } catch (error) {
      console.error('Error extracting color palette:', error);
      event.reply(`color-palette-response-${imagePath}`, {});
    }
  });

  // Helper function to convert RGB array to HEX
  function rgbToHex(rgb) {
    return `#${rgb.map((x) => x.toString(16).padStart(2, '0')).join('')}`;
  }


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

// Function to sanitize FFmpeg command arguments
function sanitizeFFmpegArgs(args) {
  return args;
  /*
  const sanitizedArgs = args.map(arg => {
    if (typeof arg === 'string') {
      // Remove any potentially harmful characters
      return arg.replace(/[<>`"'&;]/g, '');
    }
    return arg;
  });
  return sanitizedArgs;
  */
}

// IPC event to run an FFmpeg command
ipcMain.on('run-ffmpeg-command', async (event, ffmpegArgs) => {
  try {
    var cmdArgsList = sanitizeFFmpegArgs(ffmpegArgs.cmdArgs);
    var duration = parseInt(ffmpegArgs.outputDuration, 10);
    var renderId = ffmpegArgs.renderId;
    console.log('Received FFmpeg command:', cmdArgsList);
    console.log('duration:', duration);

    const ffmpegPath = getFfmpegPath();
    console.log('Using FFmpeg path:', ffmpegPath);
    if (!app.isPackaged) {
      //logStream.write(`FFmpeg command: ${ffmpegPath} ${cmdArgsList.join(' ')}\n`);
    }

    const process = execa(ffmpegPath, cmdArgsList);
    ffmpegProcesses.set(renderId, process); // Store the process

    const rl = readline.createInterface({ input: process.stderr });

    let progress = 0;
    const outputBuffer = [];

    rl.on('line', (line) => {
      if (!app.isPackaged) {
        console.log('~~~~~~~ FFmpeg output:\n', line, '\n~~~~~~~\n');
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

    process.on('exit', (code, signal) => {
      if (signal === 'SIGTERM') {
        //console.log("!! ffmpeg exit SIGTERM !!")
        //console.log(`FFmpeg process with ID: ${renderId} was stopped by user`);
        event.reply('ffmpeg-stop-response', { renderId, status: 'Stopped' });
      } else if (code === 0) {
        ffmpegProcesses.delete(renderId); // Remove the process when done
        event.reply('ffmpeg-output', { stdout: process.stdout, progress: 100 });
      } else {
        //console.log(`!! ffmpeg unexpected exit, signal = ${signal} `)
        /*
        console.log(`process.stderr =`)
        console.log(process.stderr)
        console.log(`~~err~~`)

        console.log(`process.stdout = `)
        console.log(process.stdout)
        console.log(`~~err~~`)

        const errorOutput = process.stderr ? process.stderr.toString().split('\n').slice(-10).join('\n') : 'No error details';
        */
        const relevantError = "extractRelevantError(errorOutput);"
        //console.log("RETURNING ERR CODE ")
        event.reply('ffmpeg-error', { 
          message: `FFmpeg exited with code ${code}`, 
          lastOutput: relevantError 
        });
      }
    });

  } catch (error) {
    console.error('FFmpeg command failed:', error.message);
    if (!app.isPackaged) {
      //logStream.write('error.message: ' + error.message + '\n');
    }
    const errorOutput = error.stderr ? error.stderr.toString().split('\n').slice(-10).join('\n') : 'No error details';
    const relevantError = extractRelevantError(errorOutput);
    event.reply('ffmpeg-error', { message: error.message, lastOutput: relevantError });
  }
});

function extractRelevantError(errorOutput) {
  const errorLines = errorOutput.split('\n');
  const relevantLines = errorLines.filter(line => line.includes('Error') || line.includes('Failed') || line.includes('Invalid'));
  return relevantLines.join('\n');
}

ipcMain.on('stop-ffmpeg-render', (event, { renderId }) => {
  console.log(`Received request to stop FFmpeg render with ID: ${renderId}`);
  const process = ffmpegProcesses.get(renderId);
  if (process) {
    console.log(`Stopping FFmpeg process with PID: ${process.pid}`);
    process.kill('SIGTERM');
    ffmpegProcesses.delete(renderId);
    console.log(`FFmpeg process with ID: ${renderId} stopped successfully`);
    event.reply('ffmpeg-stop-response', { renderId, status: 'Stopped' });
  } else {
    console.log(`Error: FFmpeg process with ID: ${renderId} not found`);
    event.reply('ffmpeg-stop-response', { renderId, status: 'Error: Process not found' });
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

ipcMain.on('set-output-folder', (event, folderPath) => {
  event.reply('output-folder-set', folderPath);
});
ipcMain.on('set-output-folder', (event, folderPath) => {
  event.reply('output-folder-set', folderPath);
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
          let thumbnailPath = null;

          if (audioExtensions.includes(ext)) {
            fileType = 'audio';
          } else if (imageExtensions.includes(ext)) {
            fileType = 'image';
            try {
              const metadata = sizeOf(normalizedPath);
              dimensions = `${metadata.width}x${metadata.height}`;
              const image = nativeImage.createFromPath(normalizedPath).resize({ width: 100, height: 100 });
              thumbnailPath = path.join(thumbnailCacheDir, path.basename(normalizedPath));
              fs.writeFileSync(thumbnailPath, image.toPNG());
              thumbnailMap[normalizedPath] = thumbnailPath;
              saveThumbnailMap();
            } catch (error) {
              console.error('Error reading image dimensions:', error);
            }
          }

          return {
            filename: path.basename(normalizedPath),
            filepath: normalizedPath,
            filetype: fileType,
            dimensions,
            thumbnailPath,
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
