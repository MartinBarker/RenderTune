import React, { useState, useEffect } from 'react';
import { FFmpeg, newstartRender, startRender, killProcess } from './FFmpeg';

import YouTube from './YouTube'
import FileUploader from './FileUploader'
import Table from './Table'
import Test from './Test'

function Project() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [renders, setRenders] = useState({});
  const [imageTableData, setImageTableData] = useState([]);
  const [audioTableData, setAudioTableData] = useState([]);
  const [selectedImageRows, setSelectedImageRows] = useState([]);
  const [selectedAudioRows, setSelectedAudioRows] = useState([]);
  const [width, setWidth] = useState(2000);
  const [height, setHeight] = useState(2000);

  //call when FileUploader component returns 
  const handleFilesSelect = async (newAudioTableData, newImageTableData) => {
    console.log('handleFilesSelect()')
    setImageTableData([...newImageTableData])
    setAudioTableData([...newAudioTableData])
  };

  //call when table's selected rows are changed
  const handleSelectedRowsChanged = (rows, tableType) => {
    if (tableType == 'audio') {
      setSelectedAudioRows(rows)
    } else if (tableType == 'image') {
      setSelectedImageRows(rows)
    }
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

  const handleWidthChange = (event) => {
    setWidth(parseInt(event.target.value));
  };

  const handleHeightChange = (event) => {
    setHeight(parseInt(event.target.value));
  };

  const startRender = () => {
    console.log('startRender()')
    let outputFileType = 'mkv'
    let outputFilename = '';
    let outputFilepath = '';
    let outputWidth = width;
    let outputHeight = height;
    //get splitChar based on os
    let splitChar = ''
    console.log(`window.require('os').platform()=`, window.require('os').platform())
    let platform = window.require('os').platform();
    if (platform === 'darwin' || platform === 'linux') {
      splitChar = '/'
    } else if (window.require('os').platform() === 'win32') {
      splitChar = '\\'
    } else {
      throw "no platform found"
    }
    console.log('splitChar=', splitChar)

    //get output folder
    let audio1 = selectedAudioRows[0]['filePath'];
    console.log('audio1=', audio1)

    let audio1SplitByChar = audio1.split(`${splitChar}`);
    console.log('audio1SplitByChar=', audio1SplitByChar)

    audio1SplitByChar.pop();
    console.log('audio1SplitByChar AFTER POP =', audio1SplitByChar)

    var outputFolder = audio1SplitByChar.join(splitChar);
    console.log('outputFolder=', outputFolder)
    var backupOutputFolder = outputFolder;
    backupOutputFolder = backupOutputFolder.split(`${splitChar}`)
    var folderName = backupOutputFolder.pop();
    console.log('folderName=', folderName)


    outputFilename = `${folderName}_${new Date().getUTCMilliseconds()}`
    console.log('outputFilename=', outputFilename)

    outputFilepath = `${outputFolder}${splitChar}${outputFilename}.${outputFileType}`
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
    Begin.
    <br /><hr />
    <YouTube />
    <br /><hr />

    <FileUploader onFilesSelect={handleFilesSelect} />

    <h3>Audio Files</h3>
    <Table
      tableData={audioTableData}
      onSelectedRowsChanged={(rows) => handleSelectedRowsChanged(rows, 'audio')}
      columnInfo={[
        {
          accessorKey: 'fileName',
          header: 'Name',
        },
        {
          accessorKey: 'durationDisplay',
          header: 'Length',
        },
      ]}
    />

    <h3>Image Files</h3>
    <Table
      tableData={imageTableData}
      onSelectedRowsChanged={(rows) => handleSelectedRowsChanged(rows, 'image')}
      columnInfo={[
        {
          accessorKey: 'fileName',
          header: 'Name',
        }
      ]} />

    <h3>Render Options</h3>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ marginRight: '10px' }}>
        <label htmlFor="width">Width:</label>
        <input
          type="text"
          id="width"
          value={width}
          onChange={handleWidthChange}
          style={{ width: '6ch' }}
        />
      </div>
      <div style={{ marginRight: '10px' }}>
        <label htmlFor="height">Height:</label>
        <input
          type="text"
          id="height"
          value={height}
          onChange={handleHeightChange}
          style={{ width: '6ch' }}
        />
      </div>
      <button onClick={startRender}>Start Render</button>
    </div>


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