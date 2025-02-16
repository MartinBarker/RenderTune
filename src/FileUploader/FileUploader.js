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
    console.log('dropped files :', droppedFiles);

    // Get filepath for each dropped file
    const filePaths = [];
    droppedFiles.forEach(async (file) => {
      const filePath = window.electron.getPathForFile(file);
      filePaths.push(filePath);
    });
    console.log('filePaths:', filePaths);

    // Send dropped files to the main process for sorting / metadata enrichment
    window.api.send('sort-files', filePaths);

    // Receive initial response
    window.api.receive('sort-files-initial-response', (filesInfo) => {
      console.log("sort-files-initial-response:", filesInfo);
      onFilesMetadata(filesInfo);
    });

    // Receive enriched metadata response
    window.api.receive('sort-files-enriched-response', (filesInfo) => {
      console.log("sort-files-enriched-response:", filesInfo);
      onFilesMetadata(filesInfo);
    });
    

/* //attempt2: good but bricks system 
    // Convert dropped files to list of filepaths & set initial display
    const filePaths = await Promise.all(droppedFiles.map(async (file) => await window.electron.getPathForFile(file)));
    console.log('filePaths:', filePaths);

    // Call sort-files to seperate audio/image files
    window.api.send('sort-files', filePaths);
    const sortedFiles = await new Promise((resolve) => {
      window.api.receive('sort-files-response', (filesInfo) => {
        resolve(filesInfo);
      });
    });
    console.log('sortedFiles = ', sortedFiles)
    onFilesMetadata(sortedFiles);

    // Get enriched metadata for each audio file
*/

    /*
    // Get filepath for each dropped file
    const filesArray = await Promise.all(droppedFiles.map(async (file) => {
      return new Promise(async (resolve) => {
        
        const filePath = await window.electron.getPathForFile(file);
        console.log('filePath = ', filePath)

        window.api.send('check-filepath', filePath);
        window.api.receive('check-filepath-response', (fileInfo) => {
          console.log('check-filepath-response = ', fileInfo)
          resolve(fileInfo);
        });
      });
    }));
    console.log('filesArray = ', filesArray)
    //onFilesMetadata(filesArray);

    // Get enriched filedata for each file
    const enrichedFilesInfo = filesArray.map(file => {
      if (file.filetype === 'audio') {
        window.api.send('get-audio-metadata', file.filepath);
      }
      return file;
    });
    //console.log('Enriched Files Info:', enrichedFilesInfo);
    onFilesMetadata(enrichedFilesInfo);
    */
  };

  const openNativeFileDialog = () => {
    window.api.send('open-file-dialog');
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
        Click here to select or Drag and Drop files
      </div>
    </div>
  );
};

export default FileUploader;
