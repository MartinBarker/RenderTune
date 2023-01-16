
import React from 'react';
import Border from './Border/Border'
import FfmpegTest from './FfmpegTest'
// import Projects from './Projects/ProjectsFunctional'
import Projects from './Projects/ProjectsClass'
import Sidebar from './Sidebar/Sidebar'

/*
TODO:
- frameless window
- expand/collapse responsive sidebar UI (clean code/css)
- add/edit/delete projects flow
- ffmpeg process tracking
- youtube auth+upload
- discogs auth+edit
*/


function App() {
 
  return (
    <div>
      {/*
      <Border/>
      <FfmpegTest/>
      <Projects/>
      */}
      <Sidebar/>
    </div>
  );
}

export default App;
