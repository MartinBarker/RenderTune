import React, { useState } from "react";
const { ipcRenderer } = window.require('electron');
import './FileUploader.css'
import * as mmb from 'music-metadata-browser';

const FileSelector = ({ onFilesSelected }) => {
  const [highlight, setHighlight] = useState(false);

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
    return mmb.parseBlob(file, { native: true })
      .then(metadata => {
        return metadata;
      }).catch((error) => {
        console.log('getAudioMetadata() error: ', error)
      })
  }

  async function updateFiles(files) {
    let newFileData = [];

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
            console.log('err getting audio metadata: ', err)
          }

          newFileData.push({
            'fileName': `${file.name}`,
            'filePath': `${file.path}`,
            'durationSeconds': durationSeconds,
            'durationDisplay': `${durationDisplay}`,
            'type': 'audio'
          })
        } else if (fileType.includes('image/')) {
          // Create a temporary URL for the file
          const tempUrl = URL.createObjectURL(file);
          const img = new Image();

          await new Promise((resolve, reject) => {
            img.onload = () => {
              // Get image dimensions
              const width = img.naturalWidth;
              const height = img.naturalHeight;
              URL.revokeObjectURL(tempUrl); // Clean up the temporary URL

              newFileData.push({
                'fileName': file.name,
                'filePath': file.path,
                'width': width,
                'height': height,
                'type': 'image'
              });

              resolve();
            };
            img.onerror = reject;
            img.src = tempUrl;
          });
          
        } else {
          console.log('unsupported file type = ', fileType)
        }

        //send back up outside of this component 
        console.log('sending onFilesSelected newFileData:', newFileData)
        onFilesSelected(newFileData);

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

export default FileSelector;
