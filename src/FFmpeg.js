import React, { useState, useEffect } from 'react';
import { isPackaged } from 'electron-is-packaged';
//import {taskkill} from 'taskkill';
//import fkill from 'fkill';

const execa = window.require('execa');
const readline = window.require('readline');
const moment = window.require("moment");
const { ipcRenderer } = window.require('electron');

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
        process = execa(ffmpegPath, cmdArgs);
    } catch (err) {
        console.log('ffmpeg execa err: ', err)
    }
    handleProgress(process, outputDuration, setProcesses);
    return (process)
}

function killProcess(pid) {
    console.log('killProcess() PID=', pid)
    //ipcRenderer.send('kill-process', pid);
    /*
    const isWindows = process.platform === 'win32';
    const killCommand = isWindows ? `taskkill /PID ${pid} /F` : `kill -SIGKILL ${pid}`;
    console.log('killProcess() killCommand=', killCommand)

    execa(killCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`killProcess() Error killing process ${pid}: ${error}`);
            console.error(stderr);
            return;
        } else {
            console.log('no err')
        }
        console.log(`killProcess() Process ${pid} killed successfully`);
        console.error(stdout);
    });
    */
}

const updateProcessStatus = (pid, status, setProcesses) => {
    setProcesses((prevProcesses) => ({
        ...prevProcesses,
        [pid]: { 'status':status },
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
) {
    console.log(`createFfmpegCommand() \n audioInputs.length=${audioInputs.length} \n imageInputs.length=${imageInputs} \n outputFilepath=${outputFilepath} \n width=${width} \n height=${height} \n`)
    let imageAudioSync = false;
    //create command
    let cmdArgs = []

    //get total duration
    let outputDuration = 0;
    for (var x = 0; x < audioInputs.length; x++) {
        outputDuration += parseFloat(audioInputs[x].durationSeconds);
    }
    console.log('total output duration: ', outputDuration)

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
    //for each input file
    for (var x = 0; x < [...audioInputs, ...imageInputs].length; x++) {
        console.log(`looking at file ${x}/${[...audioInputs, ...imageInputs].length}`) //, [...audioInputs, ...imageInputs][x]

        //add input to ffmpeg cmd args
        cmdArgs.push('-r', '2', '-i', [...audioInputs, ...imageInputs][x].filePath)

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

            //if file is image
            //fc_imgOrder = `${fc_imgOrder}[${x}:v]scale=w=${width}:h=${height},setsar=1,loop=${imgDuration}:${imgDuration}[v${x}];`
            fc_imgOrder = `${fc_imgOrder}[${x}:v]scale=w=${width}:h=${height}${fc_forceOriginalAspectRatio}${fc_padding},setsar=1,loop=${imgDuration}:${imgDuration}[v${x}];`
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

    console.log('construct fitler complex: ')
    console.log('fc_audioFiles: ', fc_audioFiles)
    console.log('fc_imgOrder: ', fc_imgOrder)
    console.log('fc_finalPart: ', fc_finalPart)
    console.log('______')
    console.log('filter_complex = ', filter_complex)
    cmdArgs.push('-filter_complex', filter_complex)
    cmdArgs.push('-map', '[v]', '-map', '[a]')
    cmdArgs.push('-c:a', 'pcm_s32le', '-c:v', 'libx264', '-bufsize', '3M', '-crf', '18', '-pix_fmt', 'yuv420p', '-tune', 'stillimage', '-t', `${Math.round(outputDuration * 100) / 100}`, `${outputFilepath}`)
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
            return isDev ? `ffmpeg-mac/${cmd}` : join(window.process.resourcesPath, cmd);

        } else if (platform === 'win32') {
            //for win installer build with auto-updating, it installs with 'app.asar.unpacked' filepath before node_modules
            winInstallerBuild = "app.asar.unpacked/"
            exeName = `${cmd}.exe`;

        } else {
            exeName = cmd;
        }

        if (isDev) {
            exeName = `node_modules/ffmpeg-ffprobe-static/${exeName}`;
        } else {
            exeName = join(window.process.resourcesPath, `${winInstallerBuild}node_modules/ffmpeg-ffprobe-static/${exeName}`);
        }

        //if snap build downloaded from store has wrong ffmpeg filepath:
        if (!isDev && platform === "linux" && exeName.match(/snap\/rendertune\/\d+(?=\/)\/resources/)) {
            console.log("getFfPath() snap linux path before: ", exeName)
            exeName = exeName.replace(/snap\/rendertune\/\d+(?=\/)\/resources/, "/snap/rendertune/current/resources/app.asar.unpacked/")
        }
        console.log("getFfPath() returning exeName=", exeName);

        return (exeName);
    } catch (err) {
        console.log('getFfPath cmd=', cmd, '. err = ', err)
        return ("")
    }
}

function handleProgress(process, outputDuration, setProcesses) {
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
                updateProcessStatus(process.pid, `${displayProgress}%`, setProcesses);
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

export { FFmpeg, newstartRender, killProcess };