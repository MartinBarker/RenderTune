import React, { useState, useEffect } from "react";
import styles from './FileUploader.module.css';

const { webUtils } = window.api;

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

  const handleDrop = async (event) => {
    // Get dropped files
    event.preventDefault();
    setHighlight(false);
    const droppedFiles = Array.from(event.dataTransfer.files);
    console.log('DROPPED Files:', droppedFiles);

    // Get filepath for each dropped file
    const filesArray = await Promise.all(droppedFiles.map(async (file) => {
      return new Promise(async (resolve) => {
        
        //const filePath = file.path || file.webkitRelativePath || file.name;
        const filePath = await window.electron.getPathForFile(file);

        console.log('DROPPED File Path:', filePath);

        window.api.send('check-filepath', filePath);
        window.api.receive('check-filepath-response', (fileInfo) => {
          console.log('check-filepath-response:', fileInfo);
          resolve(fileInfo);
        });
      });
    }));
    console.log('DROPPED Files Array:', filesArray);
    //onFilesMetadata(filesArray);

    // Get enriched filedata for each file
    const enrichedFilesInfo = filesArray.map(file => {
      console.log('Processing file:', file);
      if (file.filetype === 'audio') {
        console.log('DROPPED File is audio, requesting metadata for:', file.filepath);
        window.api.send('get-audio-metadata', file.filepath);
      }
      return file;
    });
    //console.log('Enriched Files Info:', enrichedFilesInfo);
    onFilesMetadata(enrichedFilesInfo);
  };

  const openNativeFileDialog = () => {
    window.api.send('open-file-dialog');
  };

  useEffect(() => {
    window.api.receive('selected-file-paths', (filesInfo) => {
      console.log('Received selected-file-paths:', filesInfo);
      const enrichedFilesInfo = filesInfo.map(file => {
        console.log('Processing file:', file);
        if (file.filetype === 'audio') {
          console.log('File is audio, requesting metadata for:', file.filepath);
          window.api.send('get-audio-metadata', file.filepath);
        }
        return file;
      });
      console.log('Enriched Files Info:', enrichedFilesInfo);
      onFilesMetadata(enrichedFilesInfo);
    });

    window.api.receive('audio-metadata-response', (metadata) => {
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
        Click here to select files
      </div>
    </div>
  );
};

export default FileUploader;
