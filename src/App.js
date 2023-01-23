
import React from 'react';

import Border from './Border/Border'
import FfmpegTest from './FfmpegTest'
// import Projects from './Projects/ProjectsFunctional'
import Projects from './Projects/ProjectsClass'
import Sidebar from './Sidebar/Sidebar'

/*
render2une: free open-source video rendering ffmpeg wrapper for youtube music accounts 

TODO:
- frameless window
- expand/collapse responsive sidebar UI (clean code/css)
- add/edit/delete projects flow
    * api connections (youtube,discogs,ryn,lastfm)

- ffmpeg process tracking (track: time, progress, how gpu/cpu/memory intensive the command is )
- youtube auth+upload
- discogs auth+edit
- view render options UI
  * view/edit raw ffmpeg command with explanations
  * 
*/


function App() {

  //border.js stuff:
  //const remote = require('electron').remote;
  //const win = remote.getCurrentWindow();

  return (
    <>
    <Border/>
      {/*
    <FfmpegTest/>
      <Projects/>
      <Sidebar/>
      */}
    </>

  );
}

export default App;
