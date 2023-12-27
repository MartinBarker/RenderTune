import React, { useState, useEffect } from 'react';
import FileSelector from './FileSelector'

function FileDropTest() {
    const [files, setFiles] = useState([]);

    //call when files are selected 
    const handleSelectedFiles = async (selectedFiles) => {
        setFiles([...selectedFiles])
        console.log('selectedFiles=', selectedFiles)
        console.log('files=', files)
    };

    return (<>
        <FileSelector onFilesSelected={handleSelectedFiles} />

        <h3>Files:</h3>
        <ul>
            {Object.keys(files).map((key) => (
                <li key={key}>
                    <div key={key}>
                        {files[key].type} {files[key].fileName}
                    </div>
                </li>
            ))}
        </ul>
    </>);
}

export default FileDropTest;