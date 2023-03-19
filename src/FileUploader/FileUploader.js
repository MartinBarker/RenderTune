// FileUploader.js

import React, { useState } from 'react';
import './FileUploader.css';

function FileUploader() {
    const [highlight, setHighlight] = useState(false);
    const [files, setFiles] = useState([]);

    function handleDragOver(event) {
        event.preventDefault();
        setHighlight(true);
    }

    function handleDragLeave(event) {
        event.preventDefault();
        setHighlight(false);
    }

    function handleDrop(event) {
        event.preventDefault();
        setHighlight(false);
        const newFiles = [...files];
        for (let i = 0; i < event.dataTransfer.files.length; i++) {
            const file = event.dataTransfer.files[i];
            if (!files.find(f => f.name === file.name && f.size === file.size)) {
                newFiles.push(file);
            }
        }
        setFiles(newFiles);
    }

    function handleFileInputChange(event) {
        const newFiles = [...files];
        for (let i = 0; i < event.target.files.length; i++) {
            const file = event.target.files[i];
            if (!files.find(f => f.name === file.name && f.size === file.size)) {
                newFiles.push(file);
            }
        }
        setFiles(newFiles);
    }

    function handleRemoveFile(index) {
        const newFiles = [...files];
        newFiles.splice(index, 1);
        setFiles(newFiles);
    }

    function handleRemoveAllFiles() {
        setFiles([]);
    }

    return (
        <div
            className={`file-uploader ${highlight ? 'highlight' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >

            <svg className="drag-icon" viewBox="0 0 24 24">
                <path d="M20,9H4v2h16V9z M20,13H4v2h16V13z M20,17H4v2h16V17z" />
            </svg>
            <div>Drag and drop files or choose</div>
            <input
                type="file"
                id="file-input"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
            />
            <label htmlFor="file-input" className="choose-btn">
                Choose
            </label>
            {files.length > 0 && (
                <button className="remove-all-btn" onClick={handleRemoveAllFiles}>
                    Remove All
                </button>
            )}
            <ul>
                {files.map((file, index) => (
                    <li key={index}>
                        <div className="file-uploader__list-item-details">
                            <button
                                className="file-uploader__list-item-remove"
                                onClick={() => handleRemoveFile(file.name)}
                            >
                                x
                            </button>
                            <p>{file.name}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default FileUploader;
