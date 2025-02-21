import React, { useState, useEffect } from "react";
import styles from './FileUploader.module.css';

const { webUtils } = window.api;

const FileUploader = ({ onFilesMetadata }) => {
  const [highlight, setHighlight] = useState(false);
  const [extensions, setExtensions] = useState(null);
  const [showFormats, setShowFormats] = useState(false);

  useEffect(() => {
    // Request file extensions when component mounts
    window.api.send('get-file-extensions');
    window.api.receive('file-extensions-response', (data) => {
      setExtensions(data);
    });

    return () => {
      window.api.removeAllListeners('file-extensions-response');
    };
  }, []);

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
        <div>Drag and drop or select files to get started</div>
        <div 
          className={styles.formatInfo}
          onMouseEnter={() => setShowFormats(true)}
          onMouseLeave={() => setShowFormats(false)}
        >
          Hover to view accepted input file formats
          {showFormats && extensions && (
            <div className={styles.formatsPopup}>
              <div>
                <strong>Audio formats:</strong>
                <div>{extensions.audioExtensions.join(', ')}</div>
              </div>
              <div>
                <strong>Image formats:</strong>
                <div>{extensions.imageExtensions.join(', ')}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
