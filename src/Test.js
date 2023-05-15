import React, { useState } from 'react';

function Test() {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const newFiles = [...files];
    for (const file of e.dataTransfer.files) {
      newFiles.push(file);
      console.log(file);
    }
    setFiles(newFiles);
  };

  const dragStyle = isDragging ? { backgroundColor: 'red' } : {};

  return (
    <>
        <div
      id='Test'
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={dragStyle}
    >
            aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
      <br/>
      aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
      <br/>
      aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
      <br/>
      aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
      <br/>
      aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
      <br/>
      {files.map((file, index) => (
        <div key={index}>{file.name}</div>
      ))}
      aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
      <br/>
      aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
      <br/>
      aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
      <br/>
      aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
      <br/>
      aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
      <br/>
      
    </div>
    </>

  );
}

export default Test;
