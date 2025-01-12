import React, { useState, useEffect } from 'react';

const os = window.require('os');
const platform = os.platform();
if (platform === 'darwin') {
  console.log("on mac, so have outputDir unset by default ")
}

function getFfPath(cmd) {
    const exeName = isWindows ? `${cmd}.exe` : cmd;
  
    if (customFfPath) return join(customFfPath, exeName);
  
    if (app.isPackaged) {
      return join(process.resourcesPath, exeName);
    }
  
    // local dev
    const components = ['ffmpeg', `${platform}-${arch}`];
    if (isWindows || isLinux) components.push('lib');
    components.push(exeName);
    return join(...components);
  }

const getFfprobePath = () => getFfPath('ffprobe');
const getFfmpegPath = () => getFfPath('ffmpeg');

export function runFfmpegProcess() {
    console.log('runFfmpegProcess()');
    
    //const ffmpegPath = getFfmpegPath();
    console.log(`platform = ${platform}`)
    //if (additionalOptions?.logCli) console.log(getFfCommandLine('ffmpeg', args));

  /*
    const process = execa(ffmpegPath, args, getExecaOptions(customExecaOptions));
  
    (async () => {
      runningFfmpegs.add(process);
      try {
        await process;
      } catch {
        // ignored here
      } finally {
        runningFfmpegs.delete(process);
      }
    })();
    return process;
    */
   return(999)
  }