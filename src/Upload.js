import React, { useState, useEffect } from 'react';
import FileUploader from './FileUploader'

function Upload() {

  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFilesSelect = (files) => {
    setSelectedFiles(files);
  };

  return (<>
    UPLOAD!
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