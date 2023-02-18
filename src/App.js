
import React from 'react';
import Border from './Border/Border'
import Sidebar from './Sidebar/Sidebar'
import Upload from './Upload/Upload'
import BlankTxtElem from './BlankTxtElem'
import NewBorder from './NewBorder'

/*
import FfmpegTest from './FfmpegTest'
import Projects from './Projects/ProjectsFunctional'
import Projects from './Projects/ProjectsClass'
import Sidebar from './Sidebar/Sidebar'
*/
function App() {
  return (
    <>
      <Sidebar/>
      <Border/>
      <Upload/>
    </>
  );
}


{/*
        <FfmpegTest/>
        <Projects/>
        <Sidebar/>
      */}

export default App;
