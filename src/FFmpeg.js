import React, { useState, useEffect } from 'react';
import { isPackaged } from 'electron-is-packaged';
import { ConnectingAirportsOutlined } from '@mui/icons-material';
const path = window.require('path');
const execa = window.require('execa');
const readline = window.require('readline');
const moment = window.require("moment");
const { ipcRenderer } = window.require('electron');

function secondsToHMS(seconds) {
    console.log(`secondsToHMS(${seconds})`)
    let hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    let minutes = Math.floor(seconds / 60);
    let secs = seconds % 60;

    // Convert to strings and pad with zeros if needed
    let hoursStr = String(hours).padStart(2, '0');
    let minutesStr = String(minutes).padStart(2, '0');
    let secsStr = String(secs).padStart(2, '0');

    console.log(`secondsToHMS() return: `,`${hoursStr}:${minutesStr}:${secsStr}`)
    return `${hoursStr}:${minutesStr}:${secsStr}`;
}

function extractSongTitle(filePath) {
    // Split the filePath by the forward slash and take the last part
    const filename = filePath.split('/').pop();
    
    // Split the filename by the period and remove the last part (file extension)
    const parts = filename.split('.');
    parts.pop();
    
    return parts.join('.');
}

function generateCueVideoCommand(audioFiles, cueImages, outputDuration) {
    console.log('generateCueVideoCommand() cueImages=',cueImages)

    let startTimes = []
    Object.entries(cueImages).forEach(([key, value]) => {
        const songTitle = extractSongTitle(key);
        //console.log(key + ': ' + value);
        startTimes.push(`${value.start} ${songTitle}`)
    });
    console.log(startTimes.join('\n'))
    //print every start here

    return new Promise(async function (resolve, reject) {
        try {

            let width = 1080;
            let height = 1080;
            let paddingCheckbox = false;
            let forceOriginalAspectRatio = false;
            let outputFilepath = "C:\\Users\\martin\\Documents\\projects\\cueFfmpeg\\cueSlideshowVideo.mkv"

            let cmdArgs = [];

            //overwrite video if it already exists
            cmdArgs.push('-y')

            //determine how long to show each image (for slideshow)
            let hardCodedImgDuration = Math.round(((outputDuration / Object.keys(cueImages).length) * 2) * 100) / 100;
            console.log(`${Object.keys(cueImages).length} images, duration=${outputDuration}, hardCodedImgDuration=${hardCodedImgDuration}`)

            //filter_complex (fc) consturction vars
            let fc_audioFiles = '';
            let fc_imgOrder = '';
            let fc_finalPart = '';

            //get all img/audio paths in a single list
            var imageFiles = Object.values(cueImages)
            console.log('imageFiles=',imageFiles)
            console.log('audioFiles=', audioFiles)
            console.log('cueImages=', cueImages)
            //const audioPaths = Object.values(audioFiles).map(entry => entry.filePath);
            let inputFiles = [...audioFiles, ...imageFiles];
            console.log('inputFiles=', inputFiles)
            let totalImgLengthSeconds = 0;
            //for each input file
            for (var x = 0; x < inputFiles.length; x++) {
                console.log(`x=${x}, inputFiles[x] = `,inputFiles[x])
                console.log(`x=${x}, inputFiles[x].type = `,inputFiles[x].type)
                //if file is audio
                if (inputFiles[x].type == 'audio') {
                    console.log(`audio type, push input: ${inputFiles[x].filePath}`)
                    cmdArgs.push('-r', '2', '-i', inputFiles[x].filePath)
                    console.log('cmdArgs = ', cmdArgs)

                    //add to filter_complex
                    fc_audioFiles = `${fc_audioFiles}[${x}:a]`

                } else if (inputFiles[x].type != 'audio') {
                    console.log(`cmd input type, image path = `, inputFiles[x].image)
                    
                    cmdArgs.push('-r', '2', '-i', inputFiles[x].image)

                    //determine if we want to add padding
                    var fc_padding = '';
                    if (paddingCheckbox) {
                        fc_padding = 'pad=${width}:${height}:-1:-1:color=white,'
                    }

                    //determine if we want to add 'force_original_aspect_ratio=decrease'
                    var fc_forceOriginalAspectRatio = '';
                    if (forceOriginalAspectRatio) {
                        fc_forceOriginalAspectRatio = 'force_original_aspect_ratio=decrease,'
                    }

                    //determine how long to display the image for
                    

                    let songLength = inputFiles[x].endSeconds - inputFiles[x].startSeconds; //Math.ceil((inputFiles[x].endSeconds - inputFiles[x].startSeconds) * 100) / 100;
                    console.log(`cmd start displaying image at ${totalImgLengthSeconds} aka ${secondsToHMS(totalImgLengthSeconds)}`)
                    totalImgLengthSeconds = totalImgLengthSeconds + songLength;
                    console.log(`cmd end displaying image at ${totalImgLengthSeconds} aka ${secondsToHMS(totalImgLengthSeconds)}`)
                    console.log(`cmd img duration: ${songLength}`)
                    
                    fc_imgOrder = `${fc_imgOrder}[${x}:v]scale=w=${width}:h=${height}${fc_forceOriginalAspectRatio}${fc_padding},setsar=1,loop=${songLength*2}:${songLength*2}[v${x}];`

                    fc_finalPart = `${fc_finalPart}[v${x}]`
                    console.log(`================================`)
                }

            }

            //construct filter_complex audio files concat text
            fc_audioFiles = `${fc_audioFiles}concat=n=${Object.keys(audioFiles).length}:v=0:a=1[a];`

            //constuct final part
            fc_finalPart = `${fc_finalPart}concat=n=${Object.keys(cueImages).length}:v=1:a=0,pad=ceil(iw/2)*2:ceil(ih/2)*2[v]`

            //consturct final combined everything filter_complex value
            let filter_complex = `${fc_audioFiles}${fc_imgOrder}${fc_finalPart}`;

            console.log('construct fitler complex: ')
            console.log('fc_audioFiles: ', fc_audioFiles)
            console.log('fc_imgOrder: ', fc_imgOrder)
            console.log('fc_finalPart: ', fc_finalPart)
            console.log('______')
            console.log('filter_complex = ', filter_complex)
            cmdArgs.push('-filter_complex', filter_complex)
            cmdArgs.push('-map', '[v]', '-map', '[a]')
            cmdArgs.push('-c:a', 'pcm_s32le', '-c:v', 'libx264', '-bufsize', '3M', '-crf', '18', '-pix_fmt', 'yuv420p', '-tune', 'stillimage', '-t', `${Math.round(outputDuration * 100) / 100}`, `${outputFilepath}`)
            
            console.log('cueVideCmd: ',cmdArgs)

            console.log('totalImgLengthSeconds=',totalImgLengthSeconds)
            console.log('outputDuration=',outputDuration)
            
            resolve(cmdArgs);
        } catch (err) {
            console.log('err=', err)
            reject(err)
        }
    })
}

function runFfmpegCommand(cmdArgs, outputDuration, setProcesses){
    try {
        const ffmpegPath = getFfmpegPath('ffmpeg'); 
        var process = null;
        console.log('ffmpeg command = \n', cmdArgs.join(' '), '\n')
        process = execa(ffmpegPath, cmdArgs);
        process.catch((err) => {
            console.log('ffmpeg execa err: ', err)
        });
        handleProgress(process, outputDuration, setProcesses);
    } catch (err) {
        console.log('ffmpeg execa err: ', err)
    }
}

function removeFileTypeExtension(audioFilename) {
    var lastDotIndex = audioFilename.lastIndexOf('.');
    if (lastDotIndex !== -1) { // Check if a dot is found
        return audioFilename.substring(0, lastDotIndex); // Extract the part before the last dot
    } else {
        return audioFilename; // No dot found, return the original filename
    }
}

function createNewRenderJob(
    renderType, 
    file, 
    audioFilename, 
    audioClipStart, 
    audioClipEnd,
    outputFolder
){  
    console.log("\ncreateNewRenderJob()")
    var newRender = {
        "renderId":"",
        "renderType":renderType,
        "renderStatus":"",
        "commandArgs":[]
    }
    if(renderType == "singleSongClipAndImage"){
        // Extract image file from mp3 and save it to outputFolder
        var imageTempLocation = `${outputFolder}\\${audioFilename}-IMAGE.jpg`
        let imageExtractionCmdArgs = [
            "-i", 
            `${file.filePath}`, 
            "-vf", 
            "scale=1920:-1", // Resize the image to 1920 pixels width (height is automatically adjusted to maintain aspect ratio)
            "-q:v", 
            "2", // Set the quality for the JPEG encoder (2 is a good compromise between file size and quality)
            imageTempLocation
        ];
        console.log('imageExtractionCmdArgs=',imageExtractionCmdArgs)

        var process = null;
        const ffmpegPath = getFfmpegPath('ffmpeg')
        process = execa(ffmpegPath, imageExtractionCmdArgs);
        process.catch((err) => {
            console.log('ffmpeg execa err: ', err)
        });
            // WAIT 4 SECONDS HERE
    setTimeout(() => {
        console.log("WAITED FOR 4 SECONDS");
        // Create ffmpeg command to combine 1 audio file and 1 image file
        console.log("CREATE VIDEO RENDER COMMAND");
        var outputVideoFilepath = `${outputFolder}\\${audioFilename} - videoSnippit.mp4`;
        var filenameWithoutExtension = removeFileTypeExtension(audioFilename);
        console.log('overlay text filenameWithoutExtension = ', filenameWithoutExtension);

        let { cmdArgs, outputDuration } = createFfmpegCommand(
            [{
                durationSeconds: 60,
                filePath: `${file.filePath}`,
                audioStartSeconds: audioClipStart,
                type: 'audio'
            }],
            [{
                filePath: `${imageTempLocation}`,
                type: 'image',
                textOverlay: null, //`${filenameWithoutExtension}`
            }],
            outputVideoFilepath,
            2000,
            2000,
            false,
            false,
            "mp4"
        );
        console.log('ffmpeg command = \n', cmdArgs.join(' '), '\n');

        // Run command, wait for it to compelte
        process = null;
        process = execa(ffmpegPath, cmdArgs);
        process.catch((err) => {
            console.log('ffmpeg execa err: ', err);
        });
        handleProgress(process, 30, null);
        console.log("FINISHED RENDERING VIDEO \n \n");

        // Delete image file
        //delete imageTempLocation
    }, 4000); // Wait for 4 seconds
    }
}

function newstartRender(renderSettings, setProcesses) {
    //create ffmpeg command
    let { cmdArgs, outputDuration } = createFfmpegCommand(
        renderSettings.audioFiles,
        renderSettings.imageFiles,
        renderSettings.outputFilepath,
        renderSettings.outputWidth,
        renderSettings.outputHeight,
        renderSettings.paddingCheckbox,
    )
    //get ffmpeg path
    const ffmpegPath = getFfmpegPath('ffmpeg'); //console.log('cmdArgs=',cmdArgs.join(' '),'\n calling execa \n')
    //start ffmpeg command
    var process = null;
    try {
        console.log('ffmpeg command = \n', cmdArgs.join(' '), '\n')
        process = execa(ffmpegPath, cmdArgs);
    } catch (err) {
        console.log('ffmpeg execa err: ', err)
    }
    handleProgress(process, outputDuration, setProcesses);
    return (process)
}

function killProcess(pid) {
    console.log('killProcess() PID=', pid)

}

const updateProcessStatus = (pid, status, setProcesses) => {
    setProcesses((prevProcesses) => ({
        ...prevProcesses,
        [pid]: { 'status': status },
    }));
};

//function to create ffmpeg command for slideshow video
function createFfmpegCommand(
    audioInputs,
    imageInputs,
    outputFilepath,
    width,
    height,
    paddingCheckbox,
    forceOriginalAspectRatio,
    outputFormat="mkv"
) {
    let imageAudioSync = false;

    //create command
    let cmdArgs = []

    //get total output video duration
    let outputDuration = 0;
    for (var x = 0; x < audioInputs.length; x++) {
        outputDuration += parseFloat(audioInputs[x].durationSeconds);
    }

    //determine how long to show each image (for slideshow)
    let imgDuration = 0;
    if (imageAudioSync) {
        //sync audio / image transition(s)
    } else {
        //dont sync audio/image transitions, just split compeltely evenly accross video's entire duration
        imgDuration = Math.round(((outputDuration / imageInputs.length) * 2) * 100) / 100;
    }

    //filter_complex (fc) consturction vars
    let fc_audioFiles = '';
    let fc_imgOrder = '';
    let fc_finalPart = '';
    let imgAudioSyncCount = 0;

    console.log('createFfmpegCommand() outputFormat = ', outputFormat)

    //for each input file
    for (var x = 0; x < [...audioInputs, ...imageInputs].length; x++) {
        const file = [...audioInputs, ...imageInputs][x];

        console.log("looking at file: ", file)

        //add input to ffmpeg cmd args
        cmdArgs.push('-r', '2')
        
        // If file is audio file with start tim, specify   
        if(file.audioStartSeconds){
            console.log('PUSH -SS')
            cmdArgs.push('-ss', `${file.audioStartSeconds}`)
        }else{
            console.log('DONT PUSH -SS')
        }

        cmdArgs.push('-i', [...audioInputs, ...imageInputs][x].filePath)

        //if file is audio
        if ([...audioInputs, ...imageInputs][x].type == 'audio') {
            //add to filter_complex
            fc_audioFiles = `${fc_audioFiles}[${x}:a]`

        } else if ([...audioInputs, ...imageInputs][x].type == 'image') {
            //if we need to sync image and audio file transitions (expects number of audio files and image files to be the same)
            if (imageAudioSync) {
                imgDuration = (audioInputs[imgAudioSyncCount].duration) * 2
                imgAudioSyncCount++;
            }

            //determine if we want to add padding
            var fc_padding = '';
            if (paddingCheckbox) {
                fc_padding = 'pad=${width}:${height}:-1:-1:color=white,'
            }

            //determine if we want to add 'force_original_aspect_ratio=decrease'
            var fc_forceOriginalAspectRatio = '';
            if (forceOriginalAspectRatio) {
                fc_forceOriginalAspectRatio = 'force_original_aspect_ratio=decrease,'
            }

            var textOverlay = "";
            if(file.textOverlay){
                textOverlay=`,drawtext=text='${file.textOverlay}':x=(w-text_w)/2:y=(h-text_h)/10:fontsize=34:fontcolor=black:box=1:boxcolor=white`
            }

            //if file is image
            //fc_imgOrder = `${fc_imgOrder}[${x}:v]scale=w=${width}:h=${height},setsar=1,loop=${imgDuration}:${imgDuration}[v${x}];`
            fc_imgOrder = `${fc_imgOrder}[${x}:v]scale=w=${width}:h=${height}${fc_forceOriginalAspectRatio}${fc_padding},setsar=1,loop=${imgDuration}:${imgDuration}${textOverlay}[v${x}];`
            //fc_imgOrder = `${fc_imgOrder}[${x}:v]scale=w=${width}:h=${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:-1:-1:color=white,setsar=1,loop=${imgDuration}:${imgDuration}[v${x}];`
            //[4:v]scale=1920:1898:force_original_aspect_ratio=decrease,pad=1920:1898:-1:-1,setsar=1,loop=580.03:580.03[v4];

            fc_finalPart = `${fc_finalPart}[v${x}]`
        }
    }

    //construct filter_complex audio files concat text
    fc_audioFiles = `${fc_audioFiles}concat=n=${audioInputs.length}:v=0:a=1[a];`

    //constuct final part
    fc_finalPart = `${fc_finalPart}concat=n=${imageInputs.length}:v=1:a=0,pad=ceil(iw/2)*2:ceil(ih/2)*2[v]`

    //consturct final combined everything filter_complex value
    let filter_complex = `${fc_audioFiles}${fc_imgOrder}${fc_finalPart}`;

    //console.log('construct fitler complex: ')
    //console.log('fc_audioFiles: ', fc_audioFiles)
    //console.log('fc_imgOrder: ', fc_imgOrder)
    //console.log('fc_finalPart: ', fc_finalPart)
    //console.log('______')
    //console.log('filter_complex = ', filter_complex)
    cmdArgs.push('-filter_complex', filter_complex)
    cmdArgs.push('-map', '[v]', '-map', '[a]')

    if(outputFormat == 'mkv'){
        cmdArgs.push('-c:a')
        cmdArgs.push('pcm_s32le')
        cmdArgs.push('-c:v')
        cmdArgs.push('libx264')
      }else if(outputFormat == 'mp4'){
        cmdArgs.push('-c:a')
        cmdArgs.push('aac')
        cmdArgs.push('-b:a')
        cmdArgs.push('320k')
        cmdArgs.push('-c:v')
        cmdArgs.push('h264')  
        //cmdArgs.push('-movflags')
        //cmdArgs.push('+faststart')
        //cmdArgs.push('-profile:v')
        //cmdArgs.push('high')
        //cmdArgs.push('-level:v')
        //cmdArgs.push('4.2 ')
        //cmdArgs.push('-vcodec')
        //cmdArgs.push('libx264')

      }

    cmdArgs.push( '-bufsize', '3M', '-crf', '18', '-pix_fmt', 'yuv420p', '-tune', 'stillimage', '-t', `${Math.round(outputDuration * 100) / 100}`, `${outputFilepath}`)
    console.log('RETURNING cmdArgs = ', cmdArgs)
    return { cmdArgs: cmdArgs, outputDuration: outputDuration }
}

///////////////////////////////

function getFfmpegPath(cmd = 'ffmpeg') {
    try {
        const isDev = !isPackaged
        const os = window.require('os');
        const platform = os.platform();
        let winInstallerBuild = "";
        let exeName = "";
        console.log("getFfPath() platform = ", platform, ", isDev=", isDev);

        if (platform === 'darwin') {
            return isDev ? `ffmpeg-mac/${cmd}` : path.join(window.process.resourcesPath, cmd);

        } else if (platform === 'win32') {
            //for win installer build with auto-updating, it installs with 'app.asar.unpacked' filepath before node_modules
            winInstallerBuild = "app.asar.unpacked/"
            exeName = `${cmd}.exe`;

        } else {
            exeName = cmd;
        }

        console.log('getFfmpegPath() join:')
        console.log('1: window.process.resourcesPath = ', window.process.resourcesPath)
        console.log('2: ${winInstallerBuild}node_modules/ffmpeg-ffprobe-static/${exeName} = ', `${winInstallerBuild}node_modules/ffmpeg-ffprobe-static/${exeName}`)

        if (isDev) {
            exeName = `node_modules/ffmpeg-ffprobe-static/${exeName}`;
        } else {
            exeName = path.join(`${window.process.resourcesPath}`, `${winInstallerBuild}node_modules/ffmpeg-ffprobe-static/${exeName}`);
        }
        console.log('getFfmpegPath() exeName=',exeName)

        //if snap build downloaded from store has wrong ffmpeg filepath:
        if (!isDev && platform === "linux" && exeName.match(/snap\/rendertune\/\d+(?=\/)\/resources/)) {
            console.log("getFfPath() snap linux path before: ", exeName)
            exeName = exeName.replace(/snap\/rendertune\/\d+(?=\/)\/resources/, "/snap/rendertune/current/resources/app.asar.unpacked/")
        }
        console.log("getFfPath() returning exeName=", exeName);

        return (exeName);
    } catch (err) {
        console.log('getFfPath cmd=', cmd, '. err = ', err)
        return(null)
    }
}

function handleProgress(process, outputDuration, setProcesses=null) {
    try {
        console.log('handleProgress() begin for process=', process)
        //read progress from process
        const rl = readline.createInterface({ input: process.stderr });
        rl.on('line', (line) => {
            const str = line.toString();
            //console.log(str)
            try {
                let match = line.match(/frame=\s*[^\s]+\s+fps=\s*[^\s]+\s+q=\s*[^\s]+\s+(?:size|Lsize)=\s*[^\s]+\s+time=\s*([^\s]+)\s+/);
                // Audio only looks like this: "line size=  233422kB time=01:45:50.68 bitrate= 301.1kbits/s speed= 353x    "
                if (!match) {
                    match = line.match(/(?:size|Lsize)=\s*[^\s]+\s+time=\s*([^\s]+)\s+/);
                }
                let startOfLine = line.substring(0, 6)
                var displayProgress = 0
                //if line begins with 'video:' then video has finished
                if (startOfLine.includes('video:')) {
                    displayProgress = 100
                } else {
                    if (!match) {
                        return
                    }
                    const str = match[1];
                    const progressTime = Math.max(0, moment.duration(str).asSeconds());
                    const progress = outputDuration ? progressTime / outputDuration : 0;
                    displayProgress = parseInt(progress * 100)
                }
                console.log(`pid=${process.pid}, status=${displayProgress}%`)//'displayProgress=', displayProgress)
                // Update the process status in the state
                if(setProcesses){
                    updateProcessStatus(process.pid, `${displayProgress}%`, setProcesses);
                }
            } catch (err) {
                console.log('Failed to parse ffmpeg progress line', err);
            }
        });
        console.log('read line handle progress finished')

    } catch (err) {
        console.log('handleProgress() err=', err)
    }
}

function FFmpeg(props) {
    return <></>;
}

export { FFmpeg, getFfmpegPath, newstartRender, createNewRenderJob, killProcess, generateCueVideoCommand, runFfmpegCommand };