import React, { useState, useEffect } from 'react';
import { FFmpeg, newstartRender, killProcess } from './FFmpeg';

import YouTube from './YouTube'
import FileUploader from './NewFileUploader'
import Table from './Table'
import Test from './Test'
const { ipcRenderer } = window.require('electron');

function CueSlideshowVid() {

  const [imageTableData, setImageTableData] = useState([]);
  const [audioTableData, setAudioTableData] = useState([]);
  const [otherTableData, setOtherTableData] = useState([]);
  const [cueContents, setCueContents] = useState('');

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
    console.log('extractAndSaveImages() cue=', cueFilepath, ', outputDuration=', outputDuration);
    let cueFileContents;
    try {
      cueFileContents = await ipcRenderer.invoke('read-cue-file', cueFilepath);
      console.log('cueFileContents=', cueFileContents)
    } catch (err) {
      console.log(err)
    }
    let tempTime = null;
    let start = outputDuration;
    let end = outputDuration;
    let cueImages = {}
    for (let i = cueFileContents.length - 1; i >= 5; i--) {
      const line = cueFileContents[i].trim();
      console.log('line: [', line, ']')
      if (line.startsWith('FILE "')) {
        console.log('line starts with FILE: ', line)
        let filePath = line.split('"')[1];
        //filePath = convertPathIfNeeded(filePath);
        console.log('filePath: ', filePath);
        console.log(`start=${start} / end=${end} \n`);

        console.log('extracing art')
        var saveImgRsp;
        try {
          saveImgRsp = await ipcRenderer.invoke('extract-album-art', filePath);
        } catch (err) {
          console.log('error extracting art: ', err)
        }

        console.log('art extracted')
        // "Prepend" the new item by creating a new object where the new key-value pair 
        // is followed by the spread of the original images object.
        cueImages = {
          [filePath]: {
            image: imagePath,
            start: start,
            end: end,
            startSeconds: timeToSeconds(start),
            endSeconds: timeToSeconds(end)
          },
          ...cueImages
        };

      } else if (line.startsWith('INDEX 01')) {
        console.log('line starts with INDEX: ', line)
        tempTime = line.split(' ')[2];
        end = start;
        start = tempTime;
      }
    }
    console.log('cueImages=', cueImages)

  }

  const beginCueVideoCreation = () => {
    let outputDuration = audioTableData[0].durationSeconds;
    let cueFilepath = otherTableData[0].filePath;
    extractAndSaveImages(cueFilepath, outputDuration);
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