import React, { useState, useEffect } from 'react';
import { FFmpeg, newstartRender, killProcess } from './FFmpeg';

import YouTube from './YouTube'
import FileUploader from './FileUploader'
import Table from './Table'
import Test from './Test'
import ExecaTest from './ExecaTest'
import TableTest from './TableTest';

function Project() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [renders, setRenders] = useState({});
  const [imageTableData, setImageTableData] = useState([]);
  const [audioTableData, setAudioTableData] = useState([]);
  const [selectedImageRows, setSelectedImageRows] = useState([]);
  const [selectedAudioRows, setSelectedAudioRows] = useState([]);
  const [width, setWidth] = useState(2000);
  const [height, setHeight] = useState(2000);
  const [paddingCheckbox, setPaddingCheckbox] = useState(false)
  const [forceOriginalAspectRatio, setForceOriginalAspectRatio] = useState(false)
  const [processes, setProcesses] = useState({});

  const handlePaddingCheckboxChange = (event) => {
    setPaddingCheckbox(event.target.checked);
  };

  const handleForceOriginalAspectRatioChange = (event) => {
    setForceOriginalAspectRatio(event.target.checked);
  }

  const handleWidthChange = (event) => {
    setWidth(parseInt(event.target.value));
  };

  const handleHeightChange = (event) => {
    setHeight(parseInt(event.target.value));
  };

  const clearFiles = () => {
    //todo: unclick select all / unsort / reset table
    setImageTableData([])
    setAudioTableData([])
    setSelectedAudioRows([])
    setSelectedFiles([])
    setSelectedImageRows([])
  }

  //call when FileUploader component returns 
  const handleFilesSelect = async (newAudioTableData, newImageTableData) => {
    setImageTableData([...newImageTableData])
    setAudioTableData([...newAudioTableData])
  };

  //call when table's selected rows are changed
  const handleSelectedRowsChanged = (rows, tableType) => {
    console.log("selected rows changed: ", rows);
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
    let killStatus = killProcess(pid);
    removeFromRenders(pid)
  }

  const startRender = () => {
    let outputFileType = 'mkv'
    let outputFilename, outputFilepath = '';
    let outputWidth = width;
    let outputHeight = height;

    //set filepath splitChar based on os
    let splitChar = ''
    let platform = window.require('os').platform();
    if (platform === 'darwin' || platform === 'linux') {
      splitChar = '/'
    } else if (window.require('os').platform() === 'win32') {
      splitChar = '\\'
    } else {
      throw "no platform found"
    }

    console.log(`startRender() selectedAudioRows=`,selectedAudioRows)
    console.log(`startRender() selectedImageRows=`,selectedImageRows)
    //set output folder location (currently: 1st audio file folderpath)
    let audio1 = selectedAudioRows[0]['filePath'];
    let audio1SplitByChar = audio1.split(`${splitChar}`);
    audio1SplitByChar.pop();
    var outputFolder = audio1SplitByChar.join(splitChar);
    var backupOutputFolder = outputFolder;
    backupOutputFolder = backupOutputFolder.split(`${splitChar}`)
    var folderName = backupOutputFolder.pop();

    //set output filename
    outputFilename = `${folderName}_${new Date().getUTCMilliseconds()}`

    //set output filepath (folder + filename)
    outputFilepath = `${outputFolder}${splitChar}${outputFilename}.${outputFileType}`

    //begin render
    let renderProcess = newstartRender(
      {
        audioFiles: selectedAudioRows,
        imageFiles: selectedImageRows,
        outputWidth: outputWidth,
        outputHeight: outputHeight,
        outputFilepath: outputFilepath,
        outputFilename: outputFilename,
        outputFileType: outputFileType,
        paddingCheckbox: paddingCheckbox
      },
      setProcesses
    )
    console.log('renderProcess.pid = ', renderProcess.pid)

    //add render to 'renders' object
    setRenders((prevState) => ({
      ...prevState,
      [renderProcess.pid]: {
        'statusPercent':0
      },
    }));
  }

  return (<>
    <br /><hr />
    <YouTube />
    <br /><hr />

    <FileUploader onFilesSelect={handleFilesSelect} />

    <button onClick={clearFiles}>Clear Files</button>

    <h3>Audio Files</h3>
    <Table
      tableData={audioTableData}
      onSelectedRowsChanged={(rows) => 
        handleSelectedRowsChanged(rows, 'audio')}
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
    {/* <div style={{ display: 'flex', alignItems: 'center' }}> */}
    <div>
      {/* Padding Checkbox */}
      <div>
        <label htmlFor="paddingCheckbox">Padding:</label>
        <input
          type="checkbox"
          id="paddingCheckbox"
          checked={paddingCheckbox}
          onChange={handlePaddingCheckboxChange}
        />
      </div>
      <br></br>

      
      {/* Force Original Aspect Ratio Checkbox */}
      <div>
        <label htmlFor="forceOriginalAspectRatio">Force Original Aspect Ratio:</label>
        <input
          type="checkbox"
          id="forceOriginalAspectRatio"
          checked={forceOriginalAspectRatio}
          onChange={handleForceOriginalAspectRatioChange}
        />
      </div>
      <br></br>

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
    </div>


    <h3>Renders:</h3>
    <button onClick={startRender}>Start Render</button>
    <ul>
      {Object.keys(processes).map((key) => (
        <li key={key}>
          <button onClick={() => handleKillProcess(key)}>X</button>
          <a>pid={key}, status={processes[key].status}</a>
        </li>
      ))}
    </ul>
  </>);
}

export default Project;