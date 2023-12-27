import React, { useState } from "react";
const { ipcRenderer } = window.require('electron');
import './FileUploader.css'
import * as mmb from 'music-metadata-browser';

const NewFileUploader = ({ onFilesSelect }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [highlight, setHighlight] = useState(false);
  const [imageTableData, setImageTableData] = useState([]);
  const [audioTableData, setAudioTableData] = useState([]);

  //
  // Handle when to call updateFiles()
  //
  const handleFileInputChange = async (event) => {
    const files = event.target.files;
    updateFiles(files)
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setHighlight(false);
    const files = event.dataTransfer.files;
    updateFiles(files)
  };

  const handleChooseFiles = () => {
    document.getElementById("fileInput").click();
  };

  //
  // Misc helper functions
  //
  function generateUniqueID() {
    const timestamp = Date.now().toString(36);
    const randomString = Math.random().toString(36).substring(2, 15);
    return timestamp + randomString;
  }

  function formatDuration(duration) {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = Math.floor(duration % 60);
    const formattedHours = hours < 10 ? `0${hours}` : hours;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }

  const getAudioDuration = (file) => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration);
        URL.revokeObjectURL(audio.src); // Clean up
      });
      audio.addEventListener('error', () => {
        reject('Error loading audio file');
      });
    });
  };

  const getAudioMetadata = async (file) => {
    console.log(`getAudioMetadata() Parsing file "${file.name}" of type ${file.type}`);
    return mmb.parseBlob(file, { native: true })
      .then(metadata => {
        console.log(`getAudioMetadata() Completed parsing of ${file.name}:`, metadata);
        return metadata;
      }).catch((error) => {
        console.log('getAudioMetadata() error: ', error)
      }).finally(() => {
        //console.log(' getAudioMetadata() finally')
      })
  }

  //
  // Handle when new files are dropped/chosen
  //
  async function updateFiles(files) {
    console.log(`updateFiles(${files})`)
    let audioFiles = {};
    let imageFiles = {};
    let otherFiles = {};
    for (var x = 0; x < files.length; x++) {
      let file = files[x];
      let fileType = file.type;
      const fileData = {
        name: file.name,
        path: file.path,
        type: fileType,
      };
      console.log(`${x} file type: ${fileType} fileData: `, fileData)

      if (fileType.startsWith('audio/')) {

        //get audio duration in the background, once we get it, set fileData['durationDisplay'] = `${durationDisplay}` and make sure 'onFilesSelect' is triggered
        
        var uniqueID = generateUniqueID();
        while(audioFiles[uniqueID]){uniqueID = generateUniqueID();}
        audioFiles[uniqueID] = fileData


      } else if (fileType.startsWith('image/')) {
        imageFiles.push(fileData)
      } else {
        otherFiles.push(fileData)
      }

      onFilesSelect(audioFiles, imageFiles, otherFiles)

    }
  }

  //
  // Dragover / UI color change logic 
  //
  const handleDragOver = (event) => {
    event.preventDefault();
    setHighlight(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setHighlight(false);
  };

  const borderColor = highlight ? "white" : "grey";

  return (
    <div
      className={`file-uploader ${highlight ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleChooseFiles}
    >
      <div className="file-uploader-box">
        <p>Drag or <button style={{ 'cursor': 'pointer' }}>choose</button> files</p>
      </div>
      <input
        type="file"
        id="fileInput"
        onChange={handleFileInputChange}
        multiple
        style={{ display: "none" }}
      />
    </div>
  );
};

export default NewFileUploader;
