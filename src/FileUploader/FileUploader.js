import React, { useState, useEffect } from "react";
import styles from './FileUploader.module.css';

const FileUploader = ({ onFilesMetadata }) => {
  const [highlight, setHighlight] = useState(false);

  const handleDragOver = (event) => {
    event.preventDefault();
    if (!highlight) setHighlight(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    if (highlight) setHighlight(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setHighlight(false);
    const files = event.dataTransfer.files;
    processFiles(files);
  };

  const openNativeFileDialog = () => {
    window.api.send('open-file-dialog');
  };

  const processFiles = (files) => {
    const filesArray = Array.from(files).map((file) => ({
      filename: file.name,
      filepath: file.path || null, // If available, depends on environment
      filetype: file.type,
      size: file.size,
    }));

    // Optionally, handle specific file types (e.g., audio metadata)
    filesArray.forEach((file) => {
      if (file.filetype.startsWith('audio/')) {
        window.api.send('get-audio-metadata', file.filepath);
      }
    });

    // Pass the files metadata to the parent component
    onFilesMetadata(filesArray);
  };

  useEffect(() => {
    window.api.receive('selected-file-paths', (filesInfo) => {
      const enrichedFilesInfo = filesInfo.map(file => {
        if (file.filetype === 'audio') {
          window.api.send('get-audio-metadata', file.filepath);
        }
        return file;
      });
      onFilesMetadata(enrichedFilesInfo);
    });

    window.api.receive('audio-metadata-response', (metadata) => {
      //console.log('FileUploader.js filepath:', metadata.filepath); 
      onFilesMetadata([{
        filetype: 'audio',
        filepath: metadata.filepath,
        filename: metadata.filename,
        duration: metadata.duration,
      }]);
    });

    return () => {
      window.api.removeAllListeners('selected-file-paths');
      window.api.removeAllListeners('audio-metadata-response');
    };
  }, []);

  return (
    <div
      className={`${styles.fileUploader} ${highlight ? styles.dragOver : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={openNativeFileDialog}
    >
      <div className={styles.fileUploaderBox}>
        Drag files here or click to select files
      </div>
    </div>
  );
};

export default FileUploader;
