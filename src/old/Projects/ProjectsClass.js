import React, { useState, useEffect } from 'react';
import './Projects.css'

function Projects() {

  const [projects, setProjects] = useState({});

  function addProject() {
    console.log('addProject()')
    let id = Date.now().toString().substr(8);
    let newProject = {
      'name': `Upload-${id}`,
      'files': {}
    }
    setProjects(oldProjects => ({ ...oldProjects, [id]: newProject }));
    console.log(projects)
  }

  return (
    <div>
      {/* 
      <button onClick={addProject}>Add Project</button>

      <div>{Object.keys(projects).length} Projects</div>

      {Object.entries(projects).map((item) => {
        console.log(item)
        return <div key={item}>
          <h3>{item[1].name}</h3>
        </div>
      })}
      */}
      
      <div id="container">
        <div id="a">
          Left stuff
          <br></br>
          Left stuff
          <br></br>
          Left stuff
          <br></br>
          Left stuff
          <br></br>
        </div>
        <div id="b">
          Right stuff
          <br></br>
          Right stuff
          <br></br>
          Right stuff
          <br></br>
          Right stuff
          <br></br>
          Right stuff
          <br></br>
          Right stuff
          <br></br>
        </div>
      </div>

    </div>
  );
}

export default Projects;




