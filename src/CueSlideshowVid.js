import React, { useState, useEffect } from 'react';
import { FFmpeg, newstartRender, killProcess, generateCueVideoCommand, runFfmpegCommand } from './FFmpeg';
import YouTube from './YouTube'
import FileUploader from './NewFileUploader'
import Table from './Table'
import Test from './Test'
const { ipcRenderer } = window.require('electron');

function timeToSeconds(timeString) {
  //console.log('timeToSeconds: ', timeString);

  // If timeString is a number, return it directly
  if (typeof timeString === 'number') {
    return timeString;
  }

  const parts = timeString.split(':').map(Number); // Split by colon and convert each part to a number
  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  const seconds = parts[2] || 0;
  return hours * 3600 + minutes * 60 + seconds; // Convert to total seconds
}

function CueSlideshowVid() {

  const [imageTableData, setImageTableData] = useState([]);
  const [audioTableData, setAudioTableData] = useState([]);
  const [otherTableData, setOtherTableData] = useState([]);
  const [cueContents, setCueContents] = useState('');
  const [cueImages, setCueImages] = useState({});
  const [processes, setProcesses] = useState({});


  //call when FileUploader component returns 
  const handleFilesSelect = async (newAudioTableData, newImageTableData, newOtherTableData) => {
    console.log('handleFilesSelect() newAudioTableData=', newAudioTableData)
    setAudioTableData([...newAudioTableData])
    console.log('handleFilesSelect() newImageTableData=', newImageTableData)
    setImageTableData([...newImageTableData])
    console.log('handleFilesSelect() newOtherTableData=', newOtherTableData)
    setOtherTableData([...newOtherTableData])
  };

  async function extractAndSaveImages(cueFilepath, outputDuration) {
    return new Promise(async function (resolve, reject) {
      console.log('extractAndSaveImages() cue=', cueFilepath, ', outputDuration=', outputDuration);
      let cueFileContents;
      try {
        cueFileContents = await ipcRenderer.invoke('read-cue-file', cueFilepath);
        //console.log('cueFileContents=', cueFileContents)
      } catch (err) {
        console.log(err)
      }
      let tempTime = null;
      let start = outputDuration;
      let end = outputDuration;
      let newCueImages = {}
      for (let i = cueFileContents.length - 1; i >= 5; i--) {
        const line = cueFileContents[i].trim();
        //console.log('line: [', line, ']')
        if (line.startsWith('FILE "')) {
          //console.log('line starts with FILE: ', line)
          let filePath = line.split('"')[1];
          //filePath = convertPathIfNeeded(filePath);
          console.log('.cue filePath: ', filePath);
          console.log(`.cue start=${start} / end=${end}`);
          console.log(`.cue start=${timeToSeconds(start)} / end=${timeToSeconds(end)}`);

          //console.log('extracing art')
          var savedImgPath = null;
          try {
            savedImgPath = await ipcRenderer.invoke('extract-album-art', filePath);
          } catch (err) {
            //console.log('error extracting art: ', err)
          }
          
          
          //console.log('art extracted: ', savedImgPath)
          // "Prepend" the new item by creating a new object where the new key-value pair 
          // is followed by the spread of the original images object.
          newCueImages = {
            [filePath]: {
              image: savedImgPath,
              start: start,
              end: end,
              startSeconds: timeToSeconds(start),
              endSeconds: timeToSeconds(end)
            },
            ...newCueImages
          };
          console.log('.cue added: ', filePath, ':', newCueImages[filePath])
          
          if(newCueImages[filePath].start != start){
            console.log("start does not match")
          }
          
          if(newCueImages[filePath].end != end){
            console.log("end does not match")
          }

          console.log('----------------------------------------')
        } else if (line.startsWith('INDEX 01')) {
          //console.log('line starts with INDEX: ', line)
          tempTime = line.split(' ')[2];
          end = start;
          start = tempTime;
        }
      }
      console.log('cueImages=', newCueImages)
      setCueImages({...newCueImages})
      
      console.log('done')
      resolve(newCueImages)
    })
  }

  const beginCueVideoCreation = async () => {
    console.log('beginCueVideoCreation()')
    try {
      //create 'cueImages' obj
      let outputDuration = audioTableData[0].durationSeconds;
      let cueFilepath = otherTableData[0].filePath;
      await extractAndSaveImages(cueFilepath, outputDuration);
      //create ffmpeg command
      console.log('beginCueVideoCreation() getting ffmpegCommand.')
      let ffmpegCommand = await generateCueVideoCommand(
        audioTableData,
        cueImages,
        outputDuration
      )
      //start ffmpeg command
      
      let renderProcess = runFfmpegCommand(ffmpegCommand, outputDuration, setProcesses)

      /*
      console.log('beginCueVideoCreation() ffmpegCommand=', ffmpegCommand, '\n', ffmpegCommand.join(' '), '\n')
      const ffmpegPath = getFfmpegPath('ffmpeg');
      var process = execa(ffmpegPath, ffmpegCommand);
      handleProgress(process, outputDuration, setProcesses);
      */
    } catch (err) {
      console.log(err)
    }
  }


  return (
    <>
      <br /><hr />
      <h1>CueSlideshowVid</h1>

      <h2>Upload Cue File</h2>

      <FileUploader onFilesSelect={handleFilesSelect} />
      <button onClick={beginCueVideoCreation}>Begin Cue Video Creation</button>
      <br /><hr />

      <pre>{cueContents}</pre>
    </>
  );
}

export default CueSlideshowVid;