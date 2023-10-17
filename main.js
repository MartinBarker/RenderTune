// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const serve = require('electron-serve');
const loadURL = serve({ directory: 'build' });
const { autoUpdater } = require('electron-updater');
const express = require('express');
const http = require('http');
const fs = require('fs');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const musicMetadata = require('music-metadata');

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

// App verison update functions
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

// App window controls functions

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

//open url in user's default browser
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

//get image resolution
ipcMain.handle('get-image-resolution', async (event, filename) => {
  console.log('get-image-resolution()')
  return new Promise(async function (resolve, reject) {
    resolve([99, 22])
    /*
    sizeOf(filename, function (err, dimensions) {
      if (!err) {
        width = dimensions.width;
        height = dimensions.height
        resolve([width, height]);
      } else {
        console.log('err getting img dimmensions:', err)
        reject(err)
      }
    });
    */
  })
});

ipcMain.handle('read-file', async (event, filename) => {
  console.log('read-file()')
  return new Promise(async function (resolve, reject) {
    try {
      let fileContents = await readAuthJSON(filename)
      resolve(fileContents)
    } catch (err) {
      reject(err)
    }
  })
});

function readAuthJSON(filename) {
  return new Promise(async function (resolve, reject) {
    try {
      const authData = fs.readFileSync(filename, 'utf8');
      resolve(JSON.parse(authData));
    } catch (err) {
      console.error('Error reading auth.json:', err.message);
      reject(null);
    }
  })
}

ipcMain.handle('extract-album-art', async (event, filepath) => {
  try {
    let rsp = await extractAlbumArt(filepath);
    return rsp;
  } catch (err) {
    console.log('extract-album-art err = ', err)
    throw err;
  }
});

async function extractAlbumArt(filePath) {
  return new Promise(async function (resolve, reject) {
    try{
      const metadata = await musicMetadata.parseFile(filePath);
      if (metadata.common.picture && metadata.common.picture.length > 0) {
        const { data, format } = metadata.common.picture[0];
  
        if (!fs.existsSync('images')) {
          fs.mkdirSync('images');
        }
  
        const imageName = path.basename(filePath, path.extname(filePath)) + '.' + format.split('/')[1];
        const outputPath = path.join('images', imageName);
  
        fs.writeFileSync(outputPath, data);
        console.log(`Saved album art for ${filePath} to ${outputPath}`);
        resolve(outputPath);
      } else {
        reject(`No album art found in ${filePath}`);
      }
    }catch(err){
      reject(err)
    }

  });
};

ipcMain.handle('read-cue-file', async (event, filepath) => {
  try {
    let lines = await readCueFile(filepath);
    return lines;
  } catch (err) {
    throw err;
  }
});

function readCueFile(filepath) {
  return new Promise(function (resolve, reject) {
    fs.readFile(filepath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading .cue file:', err.message);
        reject(err);
      } else {
        // Splitting the content by new lines
        let lines = data.split('\n');
        resolve(lines);
      }
    });
  });
}

//start http api server
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
    //await fetch(`http://localhost:8080/getOauth2Client?token=${code}`)
    //.then(response => response.json())
    //.then(data => {
    //  console.log('data rsp:', data);
    //})
    //.catch(error => console.error('caught err=', error));

    //send code to main window
    mainWindow.webContents.send('YouTubeCode', { 'code': code });
    res.send('<html><body>Please return to your rendertune window!</body></html>');
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

//-----------------------------------
// youtube api commands below
//-----------------------------------
var oauth2Client = null;
var authDotJsonRedirectUrl = '';

//create oauth2client
ipcMain.handle('create-oauth2client', async (event) => {
  return new Promise(async function (resolve, reject) {
    try {
      let result = await createOauth2Client()
      resolve(result)
    } catch (err) {
      reject(err)
    }
  })
});

function createOauth2Client() {
  return new Promise(async function (resolve, reject) {
    try {
      //get client secret vars
      let fileContents = await readAuthJSON(filename = "auth.json")
      let clientSecret = fileContents.installed.client_secret;
      let clientId = fileContents.installed.client_id;
      let redirectUrl = fileContents.installed.redirect_uris[0];
      authDotJsonRedirectUrl = redirectUrl
      console.log(`\n createOauth2Client() redirectUrl=${redirectUrl}  \n`)
      //create new OAuth2 object
      oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
      resolve('done')
    } catch (err) {
      console.log(err)
      reject(err)
    }
  })
}

//get url
ipcMain.handle('get-url', async (event) => {
  return new Promise(async function (resolve, reject) {
    try {
      let result = await getUrl()
      resolve(result)
    } catch (err) {
      reject(err)
    }
  })
});

function getUrl() {
  return new Promise(async function (resolve, reject) {
    try {
      //generate auth url
      var callbackUrl = `http://localhost:${apiServerPort}/ytCode`
      var redirectUri = authDotJsonRedirectUrl
      console.log(`\n getUrl() callbackUrl=${callbackUrl} \n`)
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/youtube.upload'],
        redirect_uri: redirectUri
      });
      resolve(authUrl);
    } catch (err) {
      console.log(err)
      reject(err)
    }
  })
}

//auth user
ipcMain.handle('auth-user', async (event, code) => {
  return new Promise(async function (resolve, reject) {
    try {
      let result = await authUser(code)
      resolve(result)
    } catch (err) {
      reject(err)
    }
  })
});

function authUser(code) {
  return new Promise(async function (resolve, reject) {
    console.log('authUser() code = ', code)
    console.log('authUser() decodeURIComponent(code) = ', decodeURIComponent(code))
    try {
      oauth2Client.getToken(decodeURIComponent(code), function (err, token) {
        if (err) {
          console.log('authUser() Error trying to retrieve access token:', err)
        }
        oauth2Client.credentials = token;
        console.log('authUser() done!')
        resolve('done');
      })
    } catch (err) {
      console.log(err)
      reject(err)
    }
  })
}

//upload video
ipcMain.handle('upload-video', async (event, code) => {
  return new Promise(async function (resolve, reject) {
    try {
      let result = await uploadVideo()
      resolve(result)
    } catch (err) {
      reject(err)
    }
  })
});

function uploadVideo(
  title = 't',
  description = 'd',
  tags = 't',
  videoFilePath = 'vid.mp4',
  thumbFilePath = 'thumb.png'
) {
  return new Promise(async function (resolve, reject) {
    console.log('uploadVideo()')
    const categoryIds = {
      Entertainment: 24,
      Education: 27,
      ScienceTechnology: 28
    }
    try {
      const service = google.youtube('v3')
      service.videos.insert({
        auth: oauth2Client,
        part: 'snippet,status',
        requestBody: {
          snippet: {
            title,
            description,
            tags,
            categoryId: categoryIds.ScienceTechnology,
            defaultLanguage: 'en',
            defaultAudioLanguage: 'en'
          },
          status: {
            privacyStatus: "private"
          },
        },
        media: {
          body: fs.createReadStream(videoFilePath),
        },
      }, function (err, response) {
        if (err) {
          console.log('The API returned an error: ' + err);
          return;
        }
        //console.log(response.data)

        console.log('Video uploaded. Uploading the thumbnail now.')
        service.thumbnails.set({
          auth: oauth2Client,
          videoId: response.data.id,
          media: {
            body: fs.createReadStream(thumbFilePath)
          },
        }, function (err, response) {
          if (err) {
            console.log('The API returned an error: ' + err);
            return;
          }
          console.log(response.data)
        })
      });
    } catch (err) {
      console.log(err)
      reject(err)
    }
  })
}