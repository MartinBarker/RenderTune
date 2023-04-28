import React, { useState, useEffect } from 'react';
import FileUploader from './FileUploader'
import Table from './Table'
import { FFmpeg, startRender, killProcess } from './FFmpeg';

function Project() {

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [renders, setRenders] = useState({});

  const handleFilesSelect = (files) => {
    setSelectedFiles(files);
    let newTableData = [];
    for (var x = 0; x < files.length; x++) {
      newTableData.push(
        {
          'fileName': `${files[x].name}`,
          'length': 'zz:zz'
        }
      )
    }
    console.log('newTableData=',newTableData)
    setTableData(newTableData);
  };

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

  return (<>
    <h2>Project.js</h2>
    <FileUploader onFilesSelect={handleFilesSelect} />
    
    <br></br> <hr></hr>
    <Table tableData={tableData}  />

    <br></br> <hr></hr>
    


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