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

  function handleProgress(process) {
    try {

      let progress = {
        percentage: 0,
        eta: 0
      };

      //read progress from process
      const rl = readline.createInterface({ input: process.stderr });
      rl.on('line', (data) => {
        try {
          ///////////////////////////////////////////////////////////////
          // Parse the stderr data to extract the progress information
          const str = data.toString();
          const matches = str.match(/time=(\d\d:\d\d:\d\d\.\d\d)/);
          if (matches) {
            const timeStr = matches[1];
            const timeArr = timeStr.split(':').map(parseFloat);
            const timeSec = timeArr[0] * 3600 + timeArr[1] * 60 + timeArr[2];
            const duration = 146.49;
            progress.percentage = (timeSec / duration) * 100;
            progress.eta = (duration - timeSec).toFixed(2);
            console.log(`Progress: ${progress.percentage.toFixed(2)}% (ETA: ${progress.eta} seconds)`);
          }
          /////////////////////////////////////////////////////////////
        } catch (err) {
          console.log('Failed to parse ffmpeg progress line', err);
        }
      });
      console.log('read line handle progress finished')

    } catch (err) {
      console.log('handleProgress() err=', err)

    }
  }

  //function to create ffmpeg command for slideshow video
  function createFfmpegCommand(audioInputs, imageInputs, outputFilepath) {
    //create command
    let cmdArgs = []

    //get total duration
    let outputDuration = 0;
    for (var x = 0; x < audioInputs.length; x++) {
      outputDuration += audioInputs[x].duration;
    }

    //determine how long to show each image (for slideshow)
    let imgDuration = Math.round(((outputDuration / imageInputs.length) * 2) * 100) / 100;

    //filter_complex (fc) consturction vars
    let fc_audioFiles = '';
    let fc_imgOrder = '';
    let fc_finalPart = '';
    //for each input file
    for (var x = 0; x < [...audioInputs, ...imageInputs].length; x++) {
      console.log(`looking at file ${x}/${[...audioInputs, ...imageInputs].length}: `, [...audioInputs, ...imageInputs][x])

      //add input to ffmpeg cmd args
      cmdArgs.push('-r', '2', '-i', [...audioInputs, ...imageInputs][x].path)

      //if file is audio
      if ([...audioInputs, ...imageInputs][x].type == 'audio') {
        //add to filter_complex
        fc_audioFiles = `${fc_audioFiles}[${x}:a]`

      } else if ([...audioInputs, ...imageInputs][x].type == 'image') {
        //if file is image
        fc_imgOrder = `${fc_imgOrder}[${x}:v]scale=w=1920:h=1937,setsar=1,loop=${imgDuration}:${imgDuration}[v${x}];`
        fc_finalPart = `${fc_finalPart}[v${x}]`
      }
    }

    //construct filter_complex audio files concat text
    fc_audioFiles = `${fc_audioFiles}concat=n=${audioFiles.length}:v=0:a=1[a];`
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


    //cmdArgs.push('[0:a]concat=n=1:v=0:a=1[a];[1:v]scale=w=1920:h=1937,setsar=1,loop=700.6:700.6[v0];[2:v]scale=w=1920:h=1937,setsar=1,loop=700.6:700.6[v1];[3:v]scale=w=1920:h=1937,setsar=1,loop=700.6:700.6[v2];[4:v]scale=w=1920:h=1937,setsar=1,loop=700.6:700.6[v3];[5:v]scale=w=1920:h=1937,setsar=1,loop=700.6:700.6[v4];[6:v]scale=w=1920:h=1937,setsar=1,loop=700.6:700.6[v5];[v0][v1][v2][v3][v4][v5]concat=n=6:v=1:a=0,pad=ceil(iw/2)*2:ceil(ih/2)*2[v]')

    cmdArgs.push('-filter_complex', filter_complex)

    cmdArgs.push('-map', '[v]', '-map', '[a]')
    cmdArgs.push('-c:a', 'pcm_s32le', '-c:v', 'libx264', '-bufsize', '3M', '-crf', '18', '-pix_fmt', 'yuv420p', '-tune', 'stillimage', '-t', `${Math.round(outputDuration * 100) / 100}`, `${outputFilepath}`)
    return cmdArgs
  }
  //render video
  function renderVideo() {
    //get output video folder/filepath
    let firstAudioFilepath = audioFiles[0]['path'];
    let splitChar = ''
    if (window.require('os').platform() === 'darwin') {
      splitChar = '/'
    } else if (window.require('os').platform() === 'win32') {
      splitChar = '\\'
    }
    let firstAudioFolderpath = firstAudioFilepath.substring(0, firstAudioFilepath.lastIndexOf(splitChar) + 1);
    let outputFilename = `MyOutputVideo${new Date().getUTCMilliseconds()}`
    let outputVideoFiletype = 'mkv'
    let outputFilepath = `${firstAudioFolderpath}${outputFilename}.${outputVideoFiletype}`
    console.log('outputFilepath=', outputFilepath)

    let cmdArgs = createFfmpegCommand(audioFiles, imageFiles, outputFilepath)
    console.log('cmdArgs = ', cmdArgs)
    console.log('~~~~~~~~~~~~~ \n', cmdArgs.join(' '), `\n~~~~~~~~~~~~~~~\n`)
    //let ffmpegCmdArgs = ['-r', '2', '-i', 'E:\\martinradio\\rips\\vinyl\\unknownrecord1\\untitled.flac', '-r', '2', '-i', 'E:\\martinradio\\rips\\vinyl\\unknownrecord1\\front.png', '-r', '2', '-i', 'E:\\martinradio\\rips\\vinyl\\unknownrecord1\\back.png', '-r', '2', '-i', 'E:\\martinradio\\rips\\vinyl\\unknownrecord1\\front2.png', '-r', '2', '-i', 'E:\\martinradio\\rips\\vinyl\\unknownrecord1\\back2.png', '-r', '2', '-i', 'E:\\martinradio\\rips\\vinyl\\unknownrecord1\\sidea.png', '-r', '2', '-i', 'E:\\martinradio\\rips\\vinyl\\unknownrecord1\\sideb.png', '-filter_complex','[0:a]concat=n=1:v=0:a=1[a];[1:v]scale=w=1920:h=1937,setsar=1,loop=700.6:700.6[v0];[2:v]scale=w=1920:h=1937,setsar=1,loop=700.6:700.6[v1];[3:v]scale=w=1920:h=1937,setsar=1,loop=700.6:700.6[v2];[4:v]scale=w=1920:h=1937,setsar=1,loop=700.6:700.6[v3];[5:v]scale=w=1920:h=1937,setsar=1,loop=700.6:700.6[v4];[6:v]scale=w=1920:h=1937,setsar=1,loop=700.6:700.6[v5];[v0][v1][v2][v3][v4][v5]concat=n=6:v=1:a=0,pad=ceil(iw/2)*2:ceil(ih/2)*2[v]','-map', '[v]', '-map', '[a]', '-c:a', 'pcm_s32le', '-c:v', 'libx264', '-bufsize', '3M', '-crf', '18', '-pix_fmt', 'yuv420p', '-tune', 'stillimage', '-t', '2102', 'E:\\martinradio\\rips\\vinyl\\unknownrecord1\\SLIDESHOW.mkv']

    const ffmpegPath = getFfmpegPath('ffmpeg');
    //console.log('ffmpegPath=', ffmpegPath)
    const process = execa(ffmpegPath, cmdArgs);
    //console.log('process=', process)
    handleProgress(process);

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
    
    let imageFiles = [];
    var fileCount = 0;
    for (const file of event.target.files) {
      console.log(`looking at file ${fileCount}: `, file);
      fileCount++;
      let fileData = {}
      fileData.name = file.name;
      fileData.path = file.path;
      let fileType = file.type.split('/')[0];
      if (fileType == 'audio') {
        //get file data
        fileData.type = 'audio'
        const metadata = await parseFile(file);
        var durationSeconds = Math.round(metadata.format.duration * 100) / 100;
        fileData.duration = durationSeconds;
        //add filedata to state
        var oldAudioFiles = [...audioFiles];
        setImageFiles(oldAudioFiles => ([ ...oldAudioFiles, fileData]));
        
        //var tmpArr = [...audioFiles];
        //tmpArr.push(fileData);
        //setAudioFiles(tmpArr)

      } else if (fileType == 'image') {
        //get filedata
        fileData.type = 'image';

        var oldImageFiles = [...imageFiles];
        setImageFiles(oldImageFiles => ([ ...oldImageFiles, fileData]));


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
          <div>
            <h3>{imageFiles.length} Image Files: </h3>
            {imageFiles.map(function (d, idx) {
              console.log('display img file')
              return (
                <li key={idx}>
                  {d.name}
                </li>
              )
            })}
            <br></br>
          </div>
          <div>
            <h3>{audioFiles.length} Audio Files: </h3>
            {audioFiles.map(function (d, idx) {
              return (
                <li key={idx}>
                  {d.name}
                </li>
              )
            })}
            <br></br>
          </div>
        </div>
        <button onClick={renderVideo}>Render Video</button>
      </div>


    </>
  );
}

export default Upload;



