import React, { useState, useEffect } from 'react';
import { FFmpeg, getFfmpegPath, newstartRender, killProcess } from './FFmpeg';

const execa = window.require('execa');
import YouTube from './YouTube'
import FileUploader from './FileUploader'
import Table from './Table'
import Test from './Test'
import ExecaTest from './ExecaTest'

function FfmpegErrorTest() {

    function triggerFfmpegJob() {
        console.log('triggerFfmpegJob()')
        //create command-i non_existent_file.mp4 output.mp4
        let cmdArgs = ['-i','non_existent_file.mp4','output.mp4'];
        //get ffmpeg path
        const ffmpegPath = getFfmpegPath('ffmpeg'); 
        //start ffmpeg command
        var process = null;
        console.log('triggerFfmpegJob() ffmpeg command = \n', cmdArgs.join(' '), '\n')
        process = execa(ffmpegPath, cmdArgs);
        process.catch((err) => {
            const errorMessage = err.stderr.split('\n').find(line => line.includes('No such file or directory'));
            console.log('ffmpeg execa err: ', errorMessage)
        });
        console.log('process = ', process)
    }

    return (<>
        <h1>FfmpegErrorTest</h1>
        <button onClick={triggerFfmpegJob}>Trigger Ffmpeg Job</button>
    </>);
}

export default FfmpegErrorTest;