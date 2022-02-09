const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const musicMetadata = require('music-metadata');
var path = require('path');
const sizeOf = require('image-size');
const getColors = require('get-image-colors');
const { resolve } = require('dns');
const { createServer } = require('http');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const PORT = 8080

const express = require('express')

const app2 = express()

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false,
            //debug tools
            showDevTools: true
        },
        //framless
        frame: false,
        backgroundColor: '#FFF',
        icon: "./build/icon.png"
    });
    //load html
    mainWindow.loadFile('./src/newindex.html');
    //open devtools
    mainWindow.webContents.openDevTools()
    //setup server
    /*
    mainWindow.webContents.once("did-finish-load", function () {
        var http = require("http");
        var server = http.createServer(function (req, res) {
            console.log(req.url)
            console.log('req.body=', req.body)
            if (req.url == '/123') {
                res.end(`ah, you send 123.`);
            } else {
                const remoteAddress = res.socket.remoteAddress;
                const remotePort = res.socket.remotePort;
                res.end(`Your IP address is ${remoteAddress} and your source port is ${remotePort}.`);
            }
        });
        server.listen(PORT);
        console.log("http://localhost:" + PORT);
    });
    */



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

//convert rgb string to hex
function rgbToHex(color) {
    return "#" + componentToHex(parseInt(color[0])) + componentToHex(parseInt(color[1])) + componentToHex(parseInt(color[2]));
}
//convert to int to hex
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

//get colors using vibrant.js for image file
ipcMain.handle('get-image-colors', async (event, filename) => {
    return new Promise(async function (resolve, reject) {
        var colorData = []
        try {
            //get color data from image
            //await getColors(path.join(__dirname, 'img.jpg')).then(colors => {
            await getColors(filename).then(colors => {
                //convert each swatch from rgb to hex and add to colorData{}
                for (var x = 0; x < colors.length; x++) {
                    let rgbColor = colors[x]._rgb
                    let hexColor = rgbToHex(rgbColor)
                    colorData.push(hexColor)
                }
            })
            resolve(colorData);
        } catch (err) {
            reject(err)
        }
    })
})

//get metadata for audio file
ipcMain.handle('get-audio-metadata', async (event, filename) => {
    const metadata = await musicMetadata.parseFile(filename, { duration: true });
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
    return [width, height];
});

async function getResolution(filename) {
    return new Promise(async function (resolve, reject) {
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
