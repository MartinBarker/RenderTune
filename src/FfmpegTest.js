/*
    Goal:
    Run FFMPEG command, track&kill processes (persistent storage)
*/
import React, { useState, useEffect } from 'react';
import { isPackaged } from 'electron-is-packaged';
const { join } = window.require('path');
const execa = window.require('execa');    
const moment = window.require("moment");
const readline = window.require('readline');

function FfmpegTest() {
   
    //run ffmpeg command 
    function runFfmpegCommand(ffmpegCmd, cutDuration=0) {
        const ffmpegPath = getFfmpegPath('ffmpeg');
        console.log('ffmpegPath=', ffmpegPath)
        const process = execa(ffmpegPath, ffmpegCmd);
        console.log('process=', process)
        handleProgress(process, cutDuration);
    }

    function getFfmpegPath(cmd) {
      try {
        const isDev = !isPackaged

        const os = window.require('os');
        const platform = os.platform();
        console.log("getFfPath() platform = ", platform, ", isDev=", isDev);
        let winInstallerBuild="";
        let exeName = "";
        if (platform === 'darwin') {
          return isDev ? `ffmpeg-mac/${cmd}` : join(window.process.resourcesPath, cmd);
        }else if(platform === 'win32'){
          //for win installer build with auto-updating, it installs with 'app.asar.unpacked' filepath before node_modules
          winInstallerBuild="app.asar.unpacked/"
          exeName = `${cmd}.exe`;
        }else{
          exeName = cmd;
        }
        
        console.log('1 exeName=',exeName)
        if(isDev){
          exeName=`node_modules/ffmpeg-ffprobe-static/${exeName}`;
        }else{
          exeName=join(window.process.resourcesPath, `${winInstallerBuild}node_modules/ffmpeg-ffprobe-static/${exeName}`);
        }
        console.log('2 exeName=',exeName)
    
        //if snap build downloaded from store has wrong ffmpeg filepath:
        if(!isDev && platform==="linux" && exeName.match(/snap\/rendertune\/\d+(?=\/)\/resources/)){
          console.log("getFfPath() snap linux path before: ", exeName)
          exeName=exeName.replace(/snap\/rendertune\/\d+(?=\/)\/resources/, "/snap/rendertune/current/resources/app.asar.unpacked/")
        }
    
        console.log('3 exeName=',exeName)
        return(exeName);
    
      } catch (err) {
        console.log('getFfPath cmd=', cmd, '. err = ', err)
        return ("")
      }
    
    }
    


    function handleProgress(process, cutDuration) {
      try{
        //set to zero % compelted as initial default
        let renderStatus='0%';
        //read progress from process
        const rl = readline.createInterface({ input: process.stderr });
        rl.on('line', (line) => {
          try {
            console.log(line)
            let match = line.match(/frame=\s*[^\s]+\s+fps=\s*[^\s]+\s+q=\s*[^\s]+\s+(?:size|Lsize)=\s*[^\s]+\s+time=\s*([^\s]+)\s+/);
            // Audio only looks like this: "line size=  233422kB time=01:45:50.68 bitrate= 301.1kbits/s speed= 353x    "
            if (!match){
              match = line.match(/(?:size|Lsize)=\s*[^\s]+\s+time=\s*([^\s]+)\s+/);
            }
            let startOfLine = line.substring(0,6)
            var displayProgress=0
            //if line begins with 'video:' then video has finished
            if(startOfLine.includes('video:')){
              displayProgress=100
              console.log('ffmpeg command finished')
            }else{
              if (!match){
                console.log('no match 2, return')
                return
              }
              const str = match[1];
              const progressTime = Math.max(0, moment.duration(str).asSeconds());
              const progress = cutDuration ? progressTime / cutDuration : 0;
              displayProgress = parseInt(progress * 100)
            }
      
            console.log('displayProgress = ',displayProgress,"%")
            //if render has completed
            if (displayProgress >= 100) {
              console.log('render finished')
            }
      
          } catch (err) {
            console.log('Failed to parse ffmpeg progress line', err);
          }
        });
        console.log('read line handle progress finished')

      }catch(err){
        console.log('handleProgress() err=',err)

      }
    }
    
    function runFfmpegCmd() {
        let cmd="-loop 1 -framerate 2 -i C:UsersmartiDocumentsprojectsjan2023-rendertune\ffmpeg-commandsimagesimg3.jpg -i C:UsersmartiDocumentsprojectsjan2023-rendertune\ffmpeg-commandsaudio filessong1.mp3 -i C:UsersmartiDocumentsprojectsjan2023-rendertune\ffmpeg-commandsaudio filessong2.mp3 -c:a pcm_s32le -filter_complex concat=n=2:v=0:a=1 -vcodec libx264 -bufsize 3M -filter:v scale=w=380:h=380,pad=ceil(iw/2)*2:ceil(ih/2)*2 -crf 18 -pix_fmt yuv420p -shortest -tune stillimage -t 724 C:UsersmartiDocumentsprojectsjan2023-rendertuneoutputVid.mkv"
        let duration=724
        runFfmpegCommand(cmd,duration)
    }

    return (
        <h3>
            FfmpegTest

            <button onClick={runFfmpegCmd}>RunFfmpegTest</button>
        </h3>
    );
}

export default FfmpegTest;




