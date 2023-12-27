import React, { useState, useEffect } from 'react';
import NewFileUploader from './NewFileUploader'
import NewTable from './NewTable'

function NewRender() {

    const [audioTableData, setAudioTableData] = useState({});
    const [imageTableData, setImageTableData] = useState({});
    const [otherTableData, setOtherTableData] = useState({});

    function handleFilesSelect(audioFiles, imageFiles, otherFiles) {
        console.log('handleFilesSelect()')
        setAudioTableData(audioFiles)
        setImageTableData(imageFiles)
        setOtherTableData(otherFiles)
    }

    return (<>
        <h1>NewRender</h1>
        <NewFileUploader onFilesSelect={handleFilesSelect} />

        <h1>Audio Files</h1>
        <NewTable
            tableData={Object.values(audioTableData)}
            columnInfo={[
                {
                    accessorKey: 'name',
                    header: 'Name',
                },
                {
                    accessorKey: 'durationDisplay',
                    header: 'Length',
                },
            ]}
        />

        <h1>Image Files</h1>
        <NewTable
            tableData={imageTableData}
            columnInfo={[
                {
                    accessorKey: 'name',
                    header: 'Name',
                }
            ]} />

    </>);
}

export default NewRender;