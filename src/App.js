import Frame from './Frame';
import Project from './Project';
import CueSlideshowVid from './CueSlideshowVid';
import YouTube2 from './YouTube2';
import Sidebar from './Sidebar';
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

  return (
    <>
      <Frame/>
      
      <div style={{marginTop:"40px", marginLeft:'55px'}}>
        {/*
        <button onClick={addProject}>Add Project</button>
        {Object.entries(projects).map(([key, value]) => (
          <div key={key}>
            {key}: {JSON.stringify(value)}
            <button onClick={() => deleteProject(key)}>Delete</button>
          </div>
        ))}
        */}


        {/* */}
        <CueSlideshowVid/>
        <YouTube2/>
        <Project/>
        
      </div>
      
    </>
  );
}

export default App;
