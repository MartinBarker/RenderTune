import React, { useState, useEffect } from 'react';
import FileUploader from './FileUploader'
import Table from './Table'
import { FFmpeg, newstartRender, startRender, killProcess } from './FFmpeg';

function Project() {

  //all files selected via choose button / drag & drop
  const [selectedFiles, setSelectedFiles] = useState([]);
  //all active renders
  const [renders, setRenders] = useState({});

  //const [tableData, setTableData] = useState([]);

  const [imageTableData, setImageTableData] = useState([]);
  const [audioTableData, setAudioTableData] = useState([]);

  const [selectedImageRows, setSelectedImageRows] = useState([]);
  const [selectedAudioRows, setSelectedAudioRows] = useState([]);

  //call when files are selected 
  const handleFilesSelect = (files) => {
    //set selected files
    setSelectedFiles(files);
    //sort files into audio / image files 
    let newImageTableData = [];
    let newAudioTableData = [];
    for (var x = 0; x < files.length; x++) {
      if (files[x].type.includes('image/')) {
        newImageTableData.push({
          'fileName': `${files[x].name}`,
          'filePath': `${files[x].path}`,
          'length': 'NA'
        })
      } else if (files[x].type.includes('audio/')) {
        newAudioTableData.push({
          'fileName': `${files[x].name}`,
          'filePath': `${files[x].path}`,
          'length': 'zz:zz'
        })
      }
    }
    //set image/audio file table data
    setImageTableData(newImageTableData)
    setAudioTableData(newAudioTableData)
  };

  //call when table's selected rows are changed
  const handleSelectedRowsChanged = (rows, tableType) => {
    if (tableType == 'audio') {
      setSelectedAudioRows(rows)
    } else if (tableType == 'image') {
      setSelectedImageRows(rows)
    }
  }

  const handleRender = (settings = {}) => {
    const uniqueId = Date.now().toString().slice(-5);
    settings = {
      'outputFilename': `AwesomeCoolVideo_${uniqueId}`,
      'outputFormat': 'mkv'
    }
    let renderProcessInfo = startRender(settings);
    setRenders(prevState => ({
      ...prevState,
      [renderProcessInfo.pid]: renderProcessInfo
    }));
  }

  const removeFromRenders = (pid) => {
    setRenders(prevState => {
      const { [pid]: omit, ...newState } = prevState;
      return newState;
    });
  };

  const handleKillProcess = (pid) => {
    console.log('handleKillProcess()')
    let killStatus = killProcess(pid);
    removeFromRenders(pid)
  }

  const startRender = () => {
    console.log('startRender()')
    let outputFileType = 'mkv'
    let outputFilename = '';
    let outputFilepath = '';
    let outputWidth = 1920;
    let outputHeight = 1920;
    //get output video folder/filepath
    let firstAudioFilepath = selectedAudioRows[0]['filePath'];
    let splitChar = ''
    if (window.require('os').platform() === 'darwin') {
      splitChar = '/'
    } else if (window.require('os').platform() === 'win32') {
      splitChar = '\\'
    }    
    let firstAudioFolderpath = firstAudioFilepath.substring(0, firstAudioFilepath.lastIndexOf(splitChar) + 1);
    outputFilename = `MyOutputVideo${new Date().getUTCMilliseconds()}`
    outputFilepath = `${firstAudioFolderpath}${outputFilename}.${outputFileType}`
    console.log('outputFilepath=', outputFilepath)

    newstartRender({
      audioFiles: selectedAudioRows,
      imageFiles: selectedImageRows,
      outputWidth: outputWidth,
      outputHeight: outputHeight,
      outputFilepath: outputFilepath,
      outputFilename: outputFilename,
      outputFileType: outputFileType,
    })
  }

  return (<>
    <FileUploader onFilesSelect={handleFilesSelect} />

    <h3>Audio Files</h3>
    <Table tableData={audioTableData} onSelectedRowsChanged={(rows) => handleSelectedRowsChanged(rows, 'audio')} />

    <h3>Image Files</h3>
    <Table tableData={imageTableData} onSelectedRowsChanged={(rows) => handleSelectedRowsChanged(rows, 'image')} />

    <h3>Render Options</h3>
    <button onClick={startRender}>Start Render</button>

    <h3>Renders</h3>
    <ul>
      {Object.keys(renders).map((key) => (
        <li key={key}>
          <button onClick={() => handleKillProcess(key)}>X</button>
          <a>pid={key} / {renders[key].outputFilename}</a>
        </li>
      ))}
    </ul>
  </>);
}
export default Project;