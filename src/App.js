import Frame from './Frame';
import Project from './Project';
import FfmpegErrorTest from './FfmpegErrorTest';
import CueSlideshowVid from './CueSlideshowVid';
import YouTube2 from './YouTube2';
import Sidebar from './Sidebar';
import TableTest from './TableTest';
import NewRender from './NewRender';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

function App() {

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

  const tableTestData = [
    {
      fileName: "a_image123.jpg",
      Name: "Summer Adventure"
    },
    {
      fileName: "b_picture456.png",
      Name: "Ocean Breeze"
    },
    {
      fileName: "b_snapshot789.jpg",
      Name: "Garden Serenity"
    },
    {
      fileName: "b_captured101.jpg",
      Name: "Urban Explorations"
    },
    {
      fileName: "b_visualize2022.png",
      Name: "Dreamy Escapes"
    },
    {
      fileName: "b_scene555.jpg",
      Name: "Natures Symphony"
    }
  ];

  const handleSelectedRowsChanged = (rows, tableType) => {
    console.log("selected rows changed: ", rows);
    var count = 1;
    for (var rowIndex in rows) {
      console.log(`${count} ${rows[rowIndex].fileName}`);
      count++;
    }
  };

  return (
    <>
      <Frame />
      <div style={{ marginTop: "40px", marginLeft: '55px' }}>
        <Router>
          <div>
            {/* Navigation Links */}
            <nav>
              <Link to="/CueSlideshowVid"><h1>CueSlideshowVid</h1></Link>
              <Link to="/YouTube2"><h1>YouTube2</h1></Link>
              <Link to="/Project"><h1>Project</h1></Link>
              <Link to="/FfmpegErrorTest"><h1>FfmpegErrorTest</h1></Link>
              <Link to="/NewRender"><h1>NewRender</h1></Link>
            </nav>

            {/* Route Configuration */}
            <Routes>
              <Route path="/CueSlideshowVid" element={<CueSlideshowVid />} />
              <Route path="/YouTube2" element={<YouTube2 />} />
              <Route path="/Project" element={<Project />} />
              <Route path="/FfmpegErrorTest" element={<FfmpegErrorTest />} />
              <Route path="/NewRender" element={<NewRender />} />
            </Routes>
          </div>
        </Router>
      </div>
    </>
  );
}

export default App;
