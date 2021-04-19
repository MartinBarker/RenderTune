const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const musicMetadata = require('music-metadata');
var path = require('path');
const sizeOf = require('image-size');
const fs = require('fs')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false,
        },
        //framless
        frame: false,
        backgroundColor: '#FFF',
        icon: "./build/icon.png"
    });
    mainWindow.loadFile('./src/newindex.html'); 
    
    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    
    // check if there are any updates availiable once main window is ready. if there are, automatically download 
    mainWindow.once('ready-to-show', () => {
        autoUpdater.checkForUpdatesAndNotify();
    });
    //notify that update is available
    autoUpdater.on('update-available', () => {
        mainWindow.webContents.send('update_available');
    });

    //notify that update has downloaded
    autoUpdater.on('update-downloaded', () => {
        mainWindow.webContents.send('update_downloaded');
    });

}

app.on('ready', () => {
    createWindow();
});

app.on('window-all-closed', function () {
    //if (process.platform !== 'darwin') {
        app.quit();
    //}
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});

//send app version to main window
ipcMain.on('app_version', (event) => {
    event.sender.send('app_version', { version: app.getVersion() });
});

//auto-update quit and install
ipcMain.on('restart_app', () => {
    autoUpdater.quitAndInstall();
});

//open folder dir picker window and return string of folder path
ipcMain.handle('choose-dir', async (event) => {
    dir = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        message: 'Choose your output folder',
        buttonLabel: 'Select this folder'
    });
    return dir.filePaths[0];
});

ipcMain.handle('read-folder-contents', async (event, myDir, slashVar) => {
    return new Promise(async function (resolve, reject) {
        
        //console.log('read-folder-contents: ', myDir );
        let files={'audio':[], 'images':[]};
        /*
        await fs.readdir(myDir, (err, dir) => {
            for(let filePath of dir){
                console.log('filepath=',filePath);
                files.push('a')
                //files.push(`${myDir}`, slashVar, `${filePath}`)
                }
            });
        console.log('read-folder-contents: returning:', files );
        return(files)
        */
        fs.readdir(myDir, function(err, result) {
            if(err) console.log('error', err);
            if (result === undefined) {
            //  console.log('result=undefined');
            } else {
                //console.log('resolve result=', result);
                for(var x = 0; x<=result.length; x++){
                    let file=result[x]
                    if(file != undefined){
                        //console.log('file=', file, )
                        if(strEndsWith(`${file.toLowerCase()}`, ".mp3") || strEndsWith(`${file.toLowerCase()}`, ".flac") || strEndsWith(`${file.toLowerCase()}`, ".wav") || strEndsWith(`${file.toLowerCase()}`, ".m4a")){
                            files.audio.push({'audioFilepath':`${myDir}${slashVar}${file}`});
                        }else if(strEndsWith(`${file.toLowerCase()}`, ".jpg") || strEndsWith(`${file.toLowerCase()}`, ".jpeg") || strEndsWith(`${file.toLowerCase()}`, ".png")){
                            files.images.push(`${myDir}${slashVar}${file}`)
                        }
                    }
                }
                resolve(files)
            }
        });
        //console.log('done')
    });
  
});

function strEndsWith(str, suffix) {
    return str.match(suffix+"$")==suffix;
}

ipcMain.handle('get-audio-metadata', async (event, filename) => {
    //console.log(`Loading metadata from ${filename}...`);
    const metadata = await musicMetadata.parseFile(filename, {duration: true});
    //console.log(`Music-metadata: track-number = ${metadata.common.track.no}, duration = ${metadata.format.duration} sec.`);
    return metadata;
});

ipcMain.handle('set-dir', async (event) => {
    let defaultPath = path.dirname('/Users');
        const { filePaths } = await dialog.showOpenDialog({
          properties: ['openDirectory', 'createDirectory'],
          defaultPath,
          title: 'title',
          message: 'message',
          buttonLabel: 'buttonLabel'
        });
        return (filePaths && filePaths.length === 1) ? filePaths[0] : undefined;
      
});



ipcMain.handle('get-image-resolution', async (event, filename) => {
    let width = '';
    let height = '';
    [width, height] = await getResolution(filename)
    return [width,height];
});

async function getResolution(filename){
    return new Promise(async function (resolve, reject) {
        sizeOf(filename, function (err, dimensions) {
            if(!err){
                width=dimensions.width;
                height=dimensions.height
                resolve([width,height]);
            }else{
                console.log('err getting img dimmensions:', err)
                reject(err)
            }
        });
    })
}
/*
//handle auto-update events
autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update_available');
});

autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update_downloaded');
});
*/
