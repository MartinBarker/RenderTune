import React, { useState } from "react";

const FileUploader = ({ onFilesSelect }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [highlight, setHighlight] = useState(false);

  const handleFileInputChange = (event) => {
    setSelectedFiles([...event.target.files]);
    onFilesSelect([...event.target.files]);
  };

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
      className="file-uploader"
      style={{ border: `2px dashed ${borderColor}` }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="file-uploader-box">
        <p>Drag or choose files</p>
        <button onClick={handleChooseFiles}>Choose</button>
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
