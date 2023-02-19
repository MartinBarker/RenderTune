import React, { useState, useEffect } from 'react';
import "./Upload.css"
import * as mmb from 'music-metadata-browser';
import { isPackaged } from 'electron-is-packaged';
const { join } = window.require('path');
const execa = window.require('execa');
const moment = window.require("moment");
const readline = window.require('readline');

function Upload() {
  const [audioFiles, setAudioFiles] = React.useState([]);
  const [imageFiles, setImageFiles] = React.useState([]);

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

  function handleProgress(process, cutDuration) {
    try {
      //set to zero % compelted as initial default
      let renderStatus = '0%';
      //read progress from process
      const rl = readline.createInterface({ input: process.stderr });
      rl.on('line', (data) => {
        try {
          console.log('data=', data)
          const str = data.toString();
          const timeMatch = str.match(/Duration: (\d{2}):(\d{2}):(\d{2})/);
          if (timeMatch) {
            const hours = parseInt(timeMatch[1], 10);
            const minutes = parseInt(timeMatch[2], 10);
            const seconds = parseInt(timeMatch[3], 10);
            duration = hours * 3600 + minutes * 60 + seconds;
            start = Date.now();
          }
          const timeMatch2 = str.match(/time=(\d{2}):(\d{2}):(\d{2})/);
          if (timeMatch2) {
            const hours = parseInt(timeMatch2[1], 10);
            const minutes = parseInt(timeMatch2[2], 10);
            const seconds = parseInt(timeMatch2[3], 10);
            const currentTime = hours * 3600 + minutes * 60 + seconds;
            const percent = Math.floor((currentTime / duration) * 100);
            const elapsedTime = Date.now() - start;
            const remainingTime = Math.floor((elapsedTime / (percent / 100)) / 60000);
            if (percent && percent !== lastTime) {
              console.log(`Progress: ${percent}% (${remainingTime} minutes remaining)`);
              lastTime = percent;
            }
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

  //render video
  function renderVideo() {
    console.log('renderVideo()')
    
    //create command
    let cmdArgs = []
    //create output filepath / filename
    let outputFilepath = 'C:\\Users\\martin\\Desktop\\12.11\\outputvideo.mkv';
    //for each input file
    let outputDuration = 0;
    for (var x = 0; x < [...audioFiles, ...imageFiles].length; x++) {
      console.log('x=',x)
      cmdArgs.push('-r','2','-i',[...audioFiles, ...imageFiles][x].path)
      console.log('here')
      //calculate duration
      if([...audioFiles, ...imageFiles][x].duration){
        console.log('duration found')
        outputDuration += [...audioFiles, ...imageFiles][x].duration;
      }
      console.log('outputDuration=',outputDuration)
    }
    let filterComplex = '';
    //concat audio
    for(var x = 0; x < audioFiles.length; x++){
      console.log(audioFiles[x])
      filterComplex=`${filterComplex}[${x}:a]`
    }
    filterComplex=`${filterComplex}concat=n=${audioFiles.length+1}:v=0:a=1[a];`

    
    //cmdArgs.push('[0:a]concat=n=1:v=0:a=1[a];[1:v]scale=w=1920:h=1937,setsar=1,loop=700.6:700.6[v0];[2:v]scale=w=1920:h=1937,setsar=1,loop=700.6:700.6[v1];[3:v]scale=w=1920:h=1937,setsar=1,loop=700.6:700.6[v2];[4:v]scale=w=1920:h=1937,setsar=1,loop=700.6:700.6[v3];[5:v]scale=w=1920:h=1937,setsar=1,loop=700.6:700.6[v4];[6:v]scale=w=1920:h=1937,setsar=1,loop=700.6:700.6[v5];[v0][v1][v2][v3][v4][v5]concat=n=6:v=1:a=0,pad=ceil(iw/2)*2:ceil(ih/2)*2[v]')
    cmdArgs.push('-map','[v]','-map','[a]')
    cmdArgs.push('-c:a', 'pcm_s32le', '-c:v', 'libx264', '-bufsize', '3M', '-crf', '18', '-pix_fmt', 'yuv420p', '-tune', 'stillimage', '-t', `${Math.round(outputDuration * 100) / 100}`, `${outputFilepath}`)
    
    console.log(cmdArgs)

    //let ffmpegCmdArgs = ['-r', '2', '-i', 'E:\\martinradio\\rips\\vinyl\\unknownrecord1\\untitled.flac', '-r', '2', '-i', 'E:\\martinradio\\rips\\vinyl\\unknownrecord1\\front.png', '-r', '2', '-i', 'E:\\martinradio\\rips\\vinyl\\unknownrecord1\\back.png', '-r', '2', '-i', 'E:\\martinradio\\rips\\vinyl\\unknownrecord1\\front2.png', '-r', '2', '-i', 'E:\\martinradio\\rips\\vinyl\\unknownrecord1\\back2.png', '-r', '2', '-i', 'E:\\martinradio\\rips\\vinyl\\unknownrecord1\\sidea.png', '-r', '2', '-i', 'E:\\martinradio\\rips\\vinyl\\unknownrecord1\\sideb.png', '-filter_complex','[0:a]concat=n=1:v=0:a=1[a];[1:v]scale=w=1920:h=1937,setsar=1,loop=700.6:700.6[v0];[2:v]scale=w=1920:h=1937,setsar=1,loop=700.6:700.6[v1];[3:v]scale=w=1920:h=1937,setsar=1,loop=700.6:700.6[v2];[4:v]scale=w=1920:h=1937,setsar=1,loop=700.6:700.6[v3];[5:v]scale=w=1920:h=1937,setsar=1,loop=700.6:700.6[v4];[6:v]scale=w=1920:h=1937,setsar=1,loop=700.6:700.6[v5];[v0][v1][v2][v3][v4][v5]concat=n=6:v=1:a=0,pad=ceil(iw/2)*2:ceil(ih/2)*2[v]','-map', '[v]', '-map', '[a]', '-c:a', 'pcm_s32le', '-c:v', 'libx264', '-bufsize', '3M', '-crf', '18', '-pix_fmt', 'yuv420p', '-tune', 'stillimage', '-t', '2102', 'E:\\martinradio\\rips\\vinyl\\unknownrecord1\\SLIDESHOW.mkv']

    const ffmpegPath = getFfmpegPath('ffmpeg');
    //console.log('ffmpegPath=', ffmpegPath)
    const process = execa(ffmpegPath, cmdArgs);
    //console.log('process=', process)
    handleProgress(process, outputDuration);

  }

  //get metadata for audio file
  async function parseFile(file) {
    //console.log(`Parsing file "${file.name}" of type ${file.type}`);
    return mmb.parseBlob(file, { native: true })
      .then(metadata => {
        //console.log(`Completed parsing of ${file.name}:`, metadata);
        return metadata;
      }).catch((error) => {
        console.log('parseFile error: ', error)
      }).finally(() => {
        //console.log('finally')
      })
  }

  //when multiple files are selected
  async function onChangeFilesSelected() {
    console.log('onChangeFilesSelected()')
    let audioFiles = []
    let imageFiles = []
    for (const file of event.target.files) {
      let fileData = {}
      console.log('examining file = ', file)
      let fileType = file.type.split('/')[0];
      console.log('fileType = ', fileType)
      fileData.name = file.name;
      fileData.path = file.path;
      if (fileType == 'audio') {
        fileData.type = 'audio'
        const metadata = await parseFile(file);
        var durationSeconds = Math.round(metadata.format.duration * 100) / 100;
        fileData.duration = durationSeconds;
        audioFiles.push(fileData);
        setAudioFiles(audioFiles)
      } else if (fileType == 'image') {
        fileData.type = 'image';
        imageFiles.push(fileData);
        setImageFiles(imageFiles)
      }
    }
  }

  return (
    <>
      <div id='upload'>
        <h2>Choose Files</h2>
        <input
          type="file"
          multiple="multiple"
          onChange={onChangeFilesSelected}
        />
        <br></br>
        <div id='filesDisplay'>
          <h3>{[...audioFiles, ...imageFiles].length} Files: </h3>
          {[...audioFiles, ...imageFiles].map(function (d, idx) {
            return (
              <li key={idx}>
                {d.name}
              </li>
            )
          })}
          <br></br>
        </div>
        <button onClick={renderVideo}>Render Video</button>
      </div>


    </>
  );
}

export default Upload;



