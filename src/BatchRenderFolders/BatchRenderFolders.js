import React, { useState } from 'react';
import FileUploader from '../FileUploader/FileUploader.js';
import styles from './BatchRenderFolders.module.css';

const BatchRenderFolders = () => {
  const [folders, setFolders] = useState([]);

  const handleFilesMetadata = (filesMetadata) => {
    const folderMap = {};
    filesMetadata.forEach((file) => {
      const folderName = file.folderName || file.filepath.split(/[/\\]/).slice(-2, -1)[0]; // Extract folder name from path
      if (!folderMap[folderName]) {
        folderMap[folderName] = [];
      }
      folderMap[folderName].push(file);
    });
    setFolders(Object.entries(folderMap));
  };

  const toggleFileSelection = (folderName, filePath) => {
    setFolders((prev) =>
      prev.map(([name, files]) =>
        name === folderName
          ? [
              name,
              files.map((file) =>
                file.filepath === filePath
                  ? { ...file, isSelected: !file.isSelected }
                  : file
              ),
            ]
          : [name, files]
      )
    );
  };

  const renderCount = folders.filter(([_, files]) =>
    files.some((file) => file.isSelected)
  ).length;

  return (
    <div className={styles.container}>
      <FileUploader onFilesMetadata={handleFilesMetadata} />
      <div className={styles.folderList}>
        {folders.map(([folderName, files]) => (
          <div key={folderName} className={styles.folder}>
            <label className={styles.folderItem}>
              <input
                type="checkbox"
                className={styles.checkbox}
              />
              {folderName}
            </label>
            <div className={styles.fileList}>
              {files.map((file) => (
                <label key={file.filepath} className={styles.fileItem}>
                  <input
                    type="checkbox"
                    checked={!!file.isSelected}
                    onChange={() => toggleFileSelection(folderName, file.filepath)}
                    className={styles.checkbox}
                  />
                  {file.filename} ({file.filetype})
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button className={styles.renderButton}>
        Render a video for all {renderCount} folders
      </button>
    </div>
  );
};

export default BatchRenderFolders;
