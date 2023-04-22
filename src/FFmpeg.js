import React from 'react';
import { isPackaged } from 'electron-is-packaged';
//import {taskkill} from 'taskkill';
//import fkill from 'fkill';

//const execa = window.require('execa');
const readline = window.require('readline');
const moment = window.require("moment");
const { ipcRenderer } = window.require('electron');

function startRender(settings = {}) {
    console.log('startRender() settings:', settings);
    let cmdArgs = [
        "-f",
        "lavfi",
        "-i",
        "color=white:s=1920x1920:d=1800",
        "-c:v",
        "libx264",
        "-crf",
        "0",
        "-preset",
        "ultrafast",
        `C:\\Users\\marti\\Documents\\projects\\rendertune-react-dev\\${settings.outputFilename}.mkv`
    ];
    const ffmpegPath = getFfmpegPath('ffmpeg');
    console.log('startRender() ffmpegPath=', ffmpegPath)
    const process = 222; //execa(ffmpegPath, cmdArgs);
    console.log('startRender() process=', process)
    handleProgress(process, 1162);
    return {
        'pid': process.pid,
        'outputFilename': settings.outputFilename,
        'outputFormat': settings.outputFormat,
        'progress': 0,
        'status': ''
    };
}

function getFfmpegPath(cmd) {
    try {
        const isDev = !isPackaged
        const os = window.require('os');
        const platform = os.platform();
        console.log("getFfPath() platform = ", platform, ", isDev=", isDev);
        let winInstallerBuild = "";
        let exeName = "";
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

function handleProgress(process, outputDuration) {
    try {
        console.log('handleProgress() begin for pid=', process.id)
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
            } catch (err) {
                console.log('Failed to parse ffmpeg progress line', err);
            }
        });
        console.log('read line handle progress finished')

    } catch (err) {
        console.log('handleProgress() err=', err)

    }
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


function FFmpeg(props) {
    return <></>;
}

export { FFmpeg, startRender, killProcess };