import React, { useState, useEffect } from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  useNavigate
} from "react-router-dom";

import Frame from './Frame/Frame.js';
import Project from './Project/Project.js';
import Settings from './Settings/Settings.js';
import YouTube from './YouTube/YouTube.js';
import Bug from './Bug/Bug.js';
import Translate from './Translate/Translate.js';
import Home from './Home/Home.js'; // Import Home component

function App() {
  return (
    <> 
    <Router>
      <Routes>
        <Route path="/" element={ <Frame> <Home/> </Frame> } /> {/* Set Home as default page */}
        <Route path="/project" element={ <Frame> <Project/> </Frame> } />
        <Route path="/settings" element={ <Frame> <Settings/> </Frame> } />
        <Route path="/youtube" element={ <Frame> <YouTube/> </Frame> } />
        <Route path="/bug" element={ <Frame> <Bug/> </Frame> } />
        <Route path="/translate" element={ <Frame> <Translate/> </Frame> } />
      </Routes>
    </Router>
    </>
  );
}

export default App;
