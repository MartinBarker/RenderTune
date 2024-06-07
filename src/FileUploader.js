import React, { useState } from "react";
const { ipcRenderer } = window.require('electron');
import './FileUploader.css'
import * as mmb from 'music-metadata-browser';

const FileUploader = ({ onFilesSelected }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [highlight, setHighlight] = useState(false);
  const [imageTableData, setImageTableData] = useState([]);
  const [audioTableData, setAudioTableData] = useState([]);

  // Handle when user selects files using the click+popup window.
  const handleFileInputOnChangeEvent = async (event) => {
    // Get file blobs
    const files = event.target.files;
    // Call function to parse, sort, and return files
    parseAndSendFiles(files)
  };

  // Handle when files are dropped into element.
  const handleFileDropEvent = (event) => {
    event.preventDefault();
    setHighlight(false);
    // Get file blobs
    const files = event.dataTransfer.files;
    // Call function to parse, sort, and return files
    parseAndSendFiles(files)
  };

  // Get all files selected
  async function parseAndSendFiles(files) {
    let fileData = []
    // For each file
    for (var x = 0; x < files.length; x++) {
      let file = files[x];
      // Get file contents
      var fileContents = null;
      try {
        fileContents = await file.text();
      } catch (error) {
          console.error(`Error reading file ${file.name}:`, error);
      }
        // Get the file extension
        let fileExtension = "";
        if (file.name.includes(".")) {
            fileExtension = file.name.slice((file.name.lastIndexOf(".") - 1 >>> 0) + 2);
        }     
      // Add file data object to fileData list.
      fileData.push({
        'type': `${file.type}`,
        'extension': `${fileExtension}`,
        'fileName': `${file.name}`,
        'path': `${file.path}`,
        'contents': fileContents,
        'durationSeconds': null,
        'durationDisplay': null
      })
      onFilesSelected(fileData);
    }
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

  //get metadata for audio file
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

  async function updateFilesComplex(files) {
    let newImageTableData = [];
    let newAudioTableData = [];
    for (var x = 0; x < files.length; x++) {
      try {
        let file = files[x];
        let fileType = file.type;
        if (fileType.includes('audio/')) {
          var durationSeconds = 0;
          var durationDisplay = `00:00:00`;
          //get audio metadata
          try {
            var metadata = await getAudioMetadata(file);
            durationSeconds = metadata.format.duration;
            durationDisplay = formatDuration(durationSeconds)
          } catch (err) {
            console.log('err getting duration: ', err)
          }
          newAudioTableData.push({
            'fileName': `${file.name}`,
            'filePath': `${file.path}`,
            'durationSeconds': durationSeconds,
            'durationDisplay': `${durationDisplay}`,
            'type': 'audio'
          })
          onFilesSelected(newAudioTableData, newImageTableData);

        } else if (fileType.includes('image/')) {
          //get image metadata (length/width)
          let [width, height] = await ipcRenderer.invoke('get-image-resolution', `${file.path}`);

          //console.log(`${file.name}: w=${width} / h=${height}`)
          newImageTableData.push({
            'fileName': `${file.name}`,
            'filePath': `${file.path}`,
            'type': 'image'
          })
        } else {
          console.log('file type = ', fileType)
        }
        setSelectedFiles([...files]);
        //send back up outside of this component 
        onFilesSelected(newAudioTableData, newImageTableData);
      } catch (err) {
        console.log('updateFiles() err=', err)
      }
    }
  }

  const handleChooseFiles = () => {
    document.getElementById("fileInput").click();
  };

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
      onDrop={handleFileDropEvent}
      onClick={handleChooseFiles}
    >
      <div className="file-uploader-box">
        <p>Drag or <button style={{ 'cursor': 'pointer' }}>choose</button> files</p>
      </div>
      <input
        type="file"
        id="fileInput"
        onChange={handleFileInputOnChangeEvent}
        multiple
        style={{ display: "none" }}
      />
    </div>
  );
};

export default FileUploader;
