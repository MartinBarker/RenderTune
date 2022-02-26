const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const musicMetadata = require('music-metadata');
var path = require('path');
const sizeOf = require('image-size');
const getColors = require('get-image-colors');
const { resolve } = require('dns');
const { createServer } = require('http');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const execa = require('execa');
var ffmpegPath = '';

//const {render} = require('./src/js/index.js');

const port = 3030
const http = require("http");
const host = 'localhost';
var qs = require('querystring');

const requestListener = async function (req, res) {
    try{
        switch (req.url) {
            //render api route hit
            case "/render":
                console.log('/render route')
                let body = '';
                let status = ''
                //get body data
                try{
                    req.on('data', async function (data) {
                        //try{
                        body += data;
                        // Too much POST data, kill the connection! 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
                        if (body.length > 1e6) {
                            req.connection.destroy();
                        }
                        try {
                            //convert body to json
                            body = JSON.parse(body)
                            //console.log('body=',body)
                            //for each render
                            for(var x = 0; x < body.length; x++){
                                //convert render options to ffmpeg arr
                                let ffmpegArgs = await createFfmpegArgs(body[x]);
                                
                                console.log('main ffmpegPath = ',ffmpegPath)
                                console.log('main ffmpegArgs = ',ffmpegArgs)
                                
                                const process = execa(ffmpegPath, ffmpegArgs)
                            }
                            //create renderOptions{} object
                            let renderOptions = {}
                            //call render() function

                            /*
                            let ffmpegPath = 'node_modules/ffmpeg-ffprobe-static/ffmpeg.exe';
                            let ffmpegArgs = ["-loop", "1", "-framerate", "2", "-i", "C:\\Users\\marti\\Documents\\IMAGE.jpg", "-i", "C:\\Users\\marti\\Documents\\AUDIO.wav", "-c:a", "pcm_s32le", "-filter_complex", "concat=n=1:v=0:a=1", "-vcodec", "libx264", "-bufsize", "3M", "-filter:v", "scale=w=1920:h=1946,pad=ceil(iw/2)*2:ceil(ih/2)*2", "-crf", "18", "-pix_fmt", "yuv420p", "-shortest", "-tune", "stillimage", "-t", "297", "C:\\Users\\marti\\Documents\\VIDEO.mkv"];
                            const process = execa(ffmpegPath, ffmpegArgs)
                            */
                            
                            //console.log('process=',process)
                            finishRequest(res, 'no issue')
                        
                        } catch (err) {
                            console.log('inside req.data, err=', err)
                            status='json err'
                            console.log('inside err status=',status)
                            finishRequest(res, status)
                        }

        
                    });
                }catch(err){
                    console.log('req.on err=',err)
                }
                console.log('ending. status=',status)
                //finishRequest(res, status)
                
        }
    }catch(err){
        console.log('e1:',err)
    }
};

async function createFfmpegArgs(renderOptions){
    
    return new Promise(async function (resolve, reject) {
   
        console.log('createFfmpegArgs() called. renderOptions=',renderOptions)
        //get output format

        let cmdArr = []
        cmdArr.push('-loop')
        cmdArr.push('1')
        cmdArr.push('-framerate')
        cmdArr.push('2')
        //image input
        cmdArr.push('-i')
        cmdArr.push(`${renderOptions.image}`)
        //audio input(s)
        var totalLength = 0
        for(var x=0; x < renderOptions.audio.length; x++){
          cmdArr.push('-i')
          cmdArr.push(`${renderOptions.audio[x]}`)
          //get length in seconds of audio file
          let length = await getAudioLength(renderOptions.audio[x])
          console.log(`${x} length=`,length)
          totalLength=totalLength+parseFloat(length)
        }
        totalLength=Math.ceil(totalLength)
        console.log('totalLength=',totalLength)
        //audio codec depending on output video format
        if(renderOptions.outputFormat == 'mkv'){
          cmdArr.push('-c:a')
          cmdArr.push('pcm_s32le')
        }else if(renderOptions.outputFormat == 'mp4'){
          cmdArr.push('-c:a')
          cmdArr.push('libmp3lame')
          cmdArr.push('-b:a')
          cmdArr.push('320k')
        }else{
          throw 'invalid output video format selected'
        }
        //filter to concatenate audio
        cmdArr.push('-filter_complex')
        cmdArr.push(`concat=n=${renderOptions.audio.length}:v=0:a=1`)
        //video codec
        cmdArr.push('-vcodec')
        cmdArr.push('libx264')
        //buffer size
        cmdArr.push('-bufsize')
        cmdArr.push('3M')
        //filter to set resolution/padding
        cmdArr.push('-filter:v')
        //if user has no padding option selected, render vid to exact width/height resolution 
        if(renderOptions.padding.toLowerCase().trim() == 'none'){
          cmdArr.push(`scale=w=${renderOptions.resolution.split('x')[0]}:h=${renderOptions.resolution.split('x')[1]},pad=ceil(iw/2)*2:ceil(ih/2)*2`)
        //else padding will be padding hex(#966e6e) color 
        }else{ 
          //get hex color
          var paddingColor = '';
          if(renderOptions.padding.toLowerCase().trim()=='white'){
            paddingColor='#ffffff'
          }else if(renderOptions.padding.toLowerCase().trim()=='black'){
            paddingColor='#000000'
          }else{
            paddingColor=renderOptions.padding
          }
          cmdArr.push(`format=rgb24,scale=w='if(gt(a,1.7777777777777777),${renderOptions.resolution.split('x')[0]},trunc(${renderOptions.resolution.split('x')[1]}*a/2)*2)':h='if(lt(a,1.7777777777777777),${renderOptions.resolution.split('x')[1]},trunc(${renderOptions.resolution.split('x')[0]}/a/2)*2)',pad=w=${renderOptions.resolution.split('x')[0]}:h=${renderOptions.resolution.split('x')[1]}:x='if(gt(a,1.7777777777777777),0,(${renderOptions.resolution.split('x')[0]}-iw)/2)':y='if(lt(a,1.7777777777777777),0,(${renderOptions.resolution.split('x')[1]}-ih)/2)':color=${paddingColor}`)
        }
        //crf
        cmdArr.push('-crf')
        cmdArr.push('18')
        //pix_fmt
        cmdArr.push('-pix_fmt')
        cmdArr.push('yuv420p')
        //shortest
        cmdArr.push('-shortest')
        //stillimage
        cmdArr.push('-tune')
        cmdArr.push('stillimage')
        
        //set video length (seconds) to trim ending
        cmdArr.push('-t')
        cmdArr.push(`${Math.ceil(totalLength)}`)
    
        //output
        cmdArr.push(`${renderOptions.outputFilepath}`)
    
        //console.log('cmdArr = ', cmdArr)


        //let args = ["-loop", "1", "-framerate", "2", "-i", "C:\\Users\\marti\\Documents\\IMAGE.jpg", "-i", "C:\\Users\\marti\\Documents\\AUDIO.wav", "-c:a", "pcm_s32le", "-filter_complex", "concat=n=1:v=0:a=1", "-vcodec", "libx264", "-bufsize", "3M", "-filter:v", "scale=w=1920:h=1946,pad=ceil(iw/2)*2:ceil(ih/2)*2", "-crf", "18", "-pix_fmt", "yuv420p", "-shortest", "-tune", "stillimage", "-t", "297", "C:\\Users\\marti\\Documents\\VIDEO.mkv"]
        resolve(cmdArr)

    })
}

async function getAudioLength(filepath){
    return new Promise(async function (resolve, reject) {
        const metadata = await musicMetadata.parseFile(filepath, { duration: true });
        //console.log(`getAudioLength(${filepath}) duration=`,metadata.format.duration)
        resolve(metadata.format.duration);
    })
}

async function finishRequest(res, status){
    console.log('finishRequest() status=',status)
    //res.writeHead(200)
    res.write(`res write status=${status}`);
    res.end('');
}

const server = http.createServer(requestListener);
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});

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
            //showDevTools: false
        },
        //framless
        frame: false,
        backgroundColor: '#FFF',
        icon: "./build/icon.png"
    });
    //load html
    mainWindow.loadFile('./src/index.html');
    //open devtools
    //mainWindow.webContents.openDevTools()
    //setup server

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
    app.quit();
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

//open directory 
ipcMain.handle('open-dir', async (event, filepath) => {
    shell.showItemInFolder(filepath) 
});

//open file with default application
ipcMain.handle('open-file', async (event, filepath) => {
    shell.openPath(filepath) 
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

//get audio file length
ipcMain.handle('get-audio-length', async (event, filename) => {
    return(await getAudioLength(filename))
});

//set ffmpegPath as global var
ipcMain.handle('set-ffmpeg-path', async (event, path) => {
    ffmpegPath = path;
});

//set custom port
ipcMain.handle('set-custom-port', async (event, newPort) => {
    let status = '';
    try {
        app.set('port', process.env.PORT || newPort);
        status = 'success'
    } catch (err) {
        status = err
    }
    return (status)
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
