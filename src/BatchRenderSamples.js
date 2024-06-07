import React, { useState } from "react";
import FileUploader from './FileUploader';
import { FFmpeg, newstartRender, createNewRenderJob, killProcess } from './FFmpeg';


const BatchRenderSamples = () => {

    const [audioFiles, setAudioFiles] = useState([]);

    function getAudioFilesFromRekordboxM3u8(fileContents) {
        let audioFiles = [];
        const lines = fileContents.split('\n');

        lines.forEach((line) => {
            line = line.trim();
            if (line && !line.startsWith('#')) {
                audioFiles.push({ filePath: line, clipStart: "00:00", clipEnd: "" });
            }
        });

        return audioFiles;
    }

    const handleFilesSelected = async (newFiles) => {
        console.log(`handleFilesSelected: ${newFiles.length}: `, newFiles);
        let newAudioFiles = [];
        for (let x = 0; x < newFiles.length; x++) {
            let file = newFiles[x];
            console.log(`file ${x} = `, file);
            // If file is .m3u8 :
            if (file.extension === "m3u8") {
                console.log('m3u8 file');
                newAudioFiles = getAudioFilesFromRekordboxM3u8(file.contents);
                setAudioFiles(newAudioFiles);
                console.log(`Found ${newAudioFiles.length} audio files: `, newAudioFiles);
            }
        }
    };

    const handleStartTimeChange = (file, value) => {
        setAudioFiles(prevAudioFiles => {
            const updatedFiles = prevAudioFiles.map(item => {
                if (item.filePath === file.filePath) {
                    return { ...item, clipStart: value };
                }
                return item;
            });
            return updatedFiles;
        });
    };

    function renderVideos(){
        console.log(`Render ${audioFiles.length} videos.`);
        var count = 0;
        audioFiles.forEach(file => {
            var filename = file.filePath.replace(/^.*[\\/]/, '')
            console.log(`${count}/${audioFiles.length}: ClipStart: ${file.clipStart}, ClipEnd: ${file.clipEnd}, Filename:${filename}`);
            // Create new ffmpeg render object
            var outputFolder = "C:\\Users\\marti\\Videos\\ig_sf_6.5.24_highlights";
            const ffmpegJob = createNewRenderJob(
                "singleSongClipAndImage", 
                file, 
                filename, 
                file.clipStart, 
                file.clipEnd,
                outputFolder
            )

            count++
        });
    };

    return (
        <>
            <h1>Batch Render Samples</h1>

            {/* Render options */}
            <button onClick={renderVideos}>Render {audioFiles.length} videos.</button>
            <br></br><br></br>

            {/* Get audio input(s) from user. */}
            <FileUploader onFilesSelected={handleFilesSelected} />

            {/* Display Files */}
            <ul>
                {audioFiles.map(file => (
                    <div key={file.filePath}>
                        <li>{file.filePath}</li>
                        <input
                            type="text"
                            placeholder="mm:ss"
                            value={file.clipStart}
                            onChange={(e) => handleStartTimeChange(file, e.target.value)}
                        />
                        <br />
                    </div>
                ))}
            </ul>
        </>
    );
};

export default BatchRenderSamples;
