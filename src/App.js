import Frame from './Frame';
import Project from './Project';
import CueSlideshowVid from './CueSlideshowVid';
import YouTube2 from './YouTube2';
import Sidebar from './Sidebar';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

function App() {
  {/* 
  // Initialize state from localStorage
  const [projects, setProjects] = useState(() => {
    const savedProjects = localStorage.getItem('projects');
    return savedProjects ? JSON.parse(savedProjects) : {};
  });

  useEffect(() => {
    // Save to localStorage whenever projects change
    localStorage.setItem('projects', JSON.stringify(projects));
  }, [projects]);

  const addProject = () => {
    const randomKey = `randomID${Math.random().toString(36).substring(2, 15)}`;
    const newProject = { [randomKey]: { 'foo': 'bar' } };
    setProjects({ ...projects, ...newProject });
  };

  const deleteProject = (key) => {
    const updatedProjects = { ...projects };
    delete updatedProjects[key];
    setProjects(updatedProjects);
  };
  */}

  return (
    <>
      <Frame />
      <div style={{marginTop:"40px", marginLeft:'55px'}}>
      <Router>
        <div>
          {/* Navigation Links */}
          <nav>
            <Link to="/CueSlideshowVid"><h1>CueSlideshowVid</h1></Link>
            <Link to="/YouTube2"><h1>YouTube2</h1></Link>
            <Link to="/Project"><h1>Project</h1></Link>
          </nav>

          {/* Route Configuration */}
          <Routes>
            <Route path="/CueSlideshowVid" element={<CueSlideshowVid />} />
            <Route path="/YouTube2" element={<YouTube2 />} />
            <Route path="/Project" element={<Project />} />
          </Routes>
        </div>
      </Router>
      </div>

      {/* Your additional JSX */}
    </>
  );
}

export default App;
