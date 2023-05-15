import React, { useState } from "react";
import './FileUploader.css'
import * as mmb from 'music-metadata-browser';


const FileUploader = ({ onFilesSelect }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [highlight, setHighlight] = useState(false);

  const [imageTableData, setImageTableData] = useState([]);
  const [audioTableData, setAudioTableData] = useState([]);

  const handleFileInputChange =  async(event) => {
    console.log('handleFileInputChange')
    let newImageTableData = [];
    let newAudioTableData = [];

    const files = event.target.files;
    for(var x = 0; x < files.length; x++){
        let file = files[x];
        let fileType = file.type;
        if(fileType.includes('audio/')){
          var durationSeconds = 0;
          var durationDisplay = `00:00:00`;
          try {
            var metadata = await parseFile(file);
            durationSeconds = metadata.format.duration;
            durationDisplay = formatDuration(durationSeconds)
          } catch (err) {
            console.log('err getting duration: ', err)
          }
          newAudioTableData.push({
            'fileName': `${file.name}`,
            'filePath': `${file.path}`,
            'durationSeconds': durationSeconds,
            'durationDisplay': `${durationDisplay}`
          })

        }else if(fileType.includes('image/')){
          newImageTableData.push({
            'fileName': `${file.name}`,
            'filePath': `${file.path}`,
            'resolution': 'NA'
          })
        }else{
          console.log('file type = ', fileType)
        }


    }
    setSelectedFiles([...files]);
    //send back up outside of this component 
    onFilesSelect(newAudioTableData, newImageTableData);
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
  const parseFile = async (file) => {
    console.log(`parseFile() Parsing file "${file.name}" of type ${file.type}`);
    return mmb.parseBlob(file, { native: true })
      .then(metadata => {
        //console.log(`parseFile() Completed parsing of ${file.name}:`, metadata);
        return metadata;
      }).catch((error) => {
        console.log('parseFile() error: ', error)
      }).finally(() => {
        //console.log(' parseFile() finally')
      })
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

  const handleDrop = (event) => {
    event.preventDefault();
    setHighlight(false);
    setSelectedFiles([...event.dataTransfer.files]);
    onFilesSelect([...event.dataTransfer.files]);
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
        <p>Drag or <button style={{'cursor':'pointer'}}>choose</button> files</p>
        
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

export default FileUploader;
