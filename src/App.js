import React, { useState, useEffect } from 'react';
import {
  HashRouter as Router,
  Routes,
  Route
} from "react-router-dom";

import Frame from './Frame/Frame.js';
import Project from './Project/Project.js';
import Settings from './Settings/Settings.js';


function App() {
  return (
    <> 
    <Router>
      <Routes>
      <Route path="/" element={ <Frame> <Project/> </Frame> } />
      <Route path="/settings" element={ <Frame> <Settings/> </Frame> } />
      </Routes>
    </Router>
    </>
  );
}

export default App;
