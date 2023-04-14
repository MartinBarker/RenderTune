import React, { useState, useEffect } from 'react';
import FileUploader from './FileUploader'
import Table from './Table'

function Upload() {

  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFilesSelect = (files) => {
    setSelectedFiles(files);
  };

  return (<>
    UPLOAD!
    <Table/>
    <FileUploader onFilesSelect={handleFilesSelect} />
      <ul>
        {selectedFiles.map((file) => (
          <li key={file.name}>
            {file.name} ({file.size} bytes)
          </li>
        ))}
      </ul>
  </>);
}
export default Upload;