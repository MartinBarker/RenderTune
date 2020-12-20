const { ipcRenderer } = require('electron');
const version = document.getElementById('version');

generateVid(
  "/Users/martinbarker/Documents/testfiles/folder/song.flac",
  "/Users/martinbarker/Documents/testfiles/folder/img.jpg",
  "/Users/martinbarker/Documents/testfiles/folder/vid.mp4",
  null
)

/*
  Functions
*/
async function generateVid(audioPath, imgPath, vidOutput, updateInfoLocation) {
  //return new Promise(async function (resolve, reject) {
      //console.log('generateVid audioPath = ', audioPath, '\n imgPath = ', imgPath, '\n vidOutput = ', vidOutput)
      //document.getElementById(updateInfoLocation).innerText = `Generating Video: 0%`

      //begin get ffmpeg info
      const ffmpeg = require('fluent-ffmpeg');
      //Get the paths to the packaged versions of the binaries we want to use
      var ffmpegPath = require('ffmpeg-static-electron').path;
      ffmpegPath = ffmpegPath.replace('app.asar', 'app.asar.unpacked')
      var ffprobePath = require('ffprobe-static-electron').path;
      ffprobePath = ffprobePath.replace('app.asar', 'app.asar.unpacked')
      //tell the ffmpeg package where it can find the needed binaries.
      ffmpeg.setFfmpegPath(ffmpegPath);
      ffmpeg.setFfprobePath(ffprobePath);
      //end set ffmpeg info

      ffmpeg()
          .input(imgPath)
          .loop()
          .addInputOption('-framerate 2')
          .input(audioPath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .audioBitrate('320k')
          .videoBitrate('8000k', true)
          .size('1920x1080')
          .outputOptions([
              '-preset medium',
              '-tune stillimage',
              '-crf 18',
              '-pix_fmt yuv420p',
              '-shortest'
          ])
          //.size('50%')

          .on('progress', function (progress) {
              if (progress.percent) {
                  //document.getElementById(updateInfoLocation).innerText = `Generating Video: ${Math.round(progress.percent)}%`
              } else {
                  //document.getElementById(updateInfoLocation).innerText = `Generating Video...`
              }
              console.info(`vid() Processing : ${progress.percent} % done`);
          })
          .on('codecData', function (data) {
              console.log('vid() codecData=', data);
          })
          .on('end', function () {
              //document.getElementById(updateInfoLocation).innerText = `Video generated.`
              console.log('vid()  file has been converted succesfully; resolve() promise');
              //resolve();
          })
          .on('error', function (err) {
              //document.getElementById(updateInfoLocation).innerText = `Error generating video.`
              console.log('vid() an error happened: ' + err.message, ', reject()');
              //reject(err);
          })
          .output(vidOutput).run()

  //})
}
/*
async function generateVid(audioPath, imgPath, vidOutput, updateInfoLocation, resolution, padding) {
  return new Promise(async function (resolve, reject) {
    console.log('generateVid \n audioPath = ', audioPath, ' \n \n imgPath = ', imgPath, ' \n \n vidOutput = ', vidOutput, `, \n \n resolution = [${resolution}], \n \n padding=${padding}`)
    if (updateInfoLocation) {
      console.log('updateInfoLocation found')
      document.getElementById(updateInfoLocation).innerText = `Generating Video: 0%`
    }

    //begin get ffmpeg info
    const ffmpeg = require('fluent-ffmpeg');
    //Get the paths to the packaged versions of the binaries we want to use
    var ffmpegPath = require('ffmpeg-static-electron').path;
    ffmpegPath = ffmpegPath.replace('app.asar', 'app.asar.unpacked')
    var ffprobePath = require('ffprobe-static-electron').path;
    ffprobePath = ffprobePath.replace('app.asar', 'app.asar.unpacked')
    //tell the ffmpeg package where it can find the needed binaries.
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath);
    //end set ffmpeg info

    if (padding != "none") {
      console.log('yes padding')
      ffmpeg()
        .input(imgPath)
        .loop()
        .addInputOption('-framerate 2')
        .input(audioPath)
        .videoCodec('libx264')
        .audioCodec('copy')
        .audioBitrate('320k')
        .videoBitrate('8000k', true)
        .size(resolution).autopad(padding)

        .outputOptions([
          '-preset medium',
          '-tune stillimage',
          '-crf 18',
          '-pix_fmt yuv420p',
          '-shortest'
        ])
        //.size('50%')

        .on('progress', function (progress) {
          if (progress.percent) {
            if (updateInfoLocation) {
              document.getElementById(updateInfoLocation).innerText = `Generating Video: ${Math.round(progress.percent)}%`
            }
          } else {
            if (updateInfoLocation) {
              document.getElementById(updateInfoLocation).innerText = `Generating Video...`
            }
          }
          console.info(`vid() Processing : ${progress.percent} % done`);
        })
        .on('codecData', function (data) {
          console.log('vid() codecData=', data);
        })
        .on('end', function () {
          if (updateInfoLocation) {
            document.getElementById(updateInfoLocation).innerText = `Video generated.`
          }
          console.log('vid()  file has been converted succesfully; resolve() promise');
          resolve();
        })
        .on('error', function (err) {
          if (updateInfoLocation) {
            document.getElementById(updateInfoLocation).innerText = `Error generating video.`
          }
          console.log('vid() an error happened: ' + err.message, ', reject()');
          reject(err);
        })
        .output(vidOutput).run()
    } else {
      console.log('no padding')
      //no padding
      ffmpeg()
        .input(imgPath)
        .loop()
        .addInputOption('-framerate 2')
        .input(audioPath)
        .videoCodec('libx264')
        .audioCodec('copy')
        .audioBitrate('320k')
        .videoBitrate('8000k', true)
        .size(resolution)

        .outputOptions([
          '-preset medium',
          '-tune stillimage',
          '-crf 18',
          '-pix_fmt yuv420p',
          '-shortest'
        ])
        //.size('50%')

        .on('progress', function (progress) {
          if (progress.percent) {
            if (updateInfoLocation) {
              document.getElementById(updateInfoLocation).innerText = `Generating Video: ${Math.round(progress.percent)}%`
            }
          } else {
            if (updateInfoLocation) {
              document.getElementById(updateInfoLocation).innerText = `Generating Video...`
            }
          }
          console.info(`vid() Processing : ${progress.percent} % done`);
        })
        .on('codecData', function (data) {
          console.log('vid() codecData=', data);
        })
        .on('end', function () {
          if (updateInfoLocation) {
            document.getElementById(updateInfoLocation).innerText = `Video generated.`
          }
          console.log('vid()  file has been converted succesfully; resolve() promise');
          resolve();
        })
        .on('error', function (err) {
          if (updateInfoLocation) {
            document.getElementById(updateInfoLocation).innerText = `Error generating video.`
          }
          console.log('vid() an error happened: ' + err.message, ', reject()');
          reject(err);
        })
        .output(vidOutput).run()
    }



  })
}
*/

/*
  auto-update popup downloading code
*/
const notification = document.getElementById('notification');
const message = document.getElementById('message');
const restartButton = document.getElementById('restart-button');
ipcRenderer.on('update_available', () => {
  ipcRenderer.removeAllListeners('update_available');
  message.innerText = 'A new update is available. Downloading now...';
  notification.classList.remove('hidden');
});
ipcRenderer.on('update_downloaded', () => {
  ipcRenderer.removeAllListeners('update_downloaded');
  message.innerText = 'Update Downloaded. It will be installed on restart. Restart now?';
  restartButton.classList.remove('hidden');
  notification.classList.remove('hidden');
});
function closeNotification() {
  notification.classList.add('hidden');
}
function restartApp() {
  ipcRenderer.send('restart_app');
}

/*
  recieve app version and send it to html 
*/
ipcRenderer.send('app_version');
ipcRenderer.on('app_version', (event, arg) => {
  ipcRenderer.removeAllListeners('app_version');
  version.innerText = 'Version ' + arg.version;
});